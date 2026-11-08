// src/lib/referral-service.ts

import { Db, ObjectId, ClientSession } from 'mongodb';
import crypto from 'crypto';
import { sendNotificationToUser } from './notification';

const USERS_COLLECTION = 'users';
const REFERRALS_COLLECTION = 'referrals';
const TRANSACTIONS_COLLECTION = 'coinTransactions';
const ORDERS_COLLECTION = 'orders';

// Unambiguous 32-character set (no 0/O, no 1/I)
const CODE_CHARSET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const MIN_QUALIFYING_ORDER_AMOUNT = 499;
export const REFERRAL_REWARD_COINS = 50;
export const MAX_REFERRALS_PER_USER: number | null = null; // Unlimited referrals
export const COIN_VALIDITY_DAYS = 30;

/**
 * Generates a completely unique, random 6-character referral code.
 * Checks MongoDB to guarantee no two users ever share the same code.
 */
export async function generateUniqueReferralCode(db: Db): Promise<string> {
  const usersCollection = db.collection(USERS_COLLECTION);
  let attempts = 0;
  const maxAttempts = 15;

  while (attempts < maxAttempts) {
    attempts++;
    let code = '';
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      code += CODE_CHARSET[bytes[i] % CODE_CHARSET.length];
    }

    const existing = await usersCollection.findOne(
      { referralCode: code },
      { projection: { _id: 1 } }
    );

    if (!existing) {
      return code;
    }
  }

  // Fallback in astronomical edge cases
  const timestampPart = Date.now().toString(36).toUpperCase().slice(-3);
  let randomPart = '';
  const fallbackBytes = crypto.randomBytes(3);
  for (let i = 0; i < 3; i++) {
    randomPart += CODE_CHARSET[fallbackBytes[i] % CODE_CHARSET.length];
  }
  return `${randomPart}${timestampPart}`;
}

/**
 * Ensures the given user has a referralCode.
 * If user does not have one, generates and stores it.
 */
export async function ensureUserReferralCode(db: Db, userId: ObjectId | string): Promise<string> {
  const usersCollection = db.collection(USERS_COLLECTION);
  const uid = typeof userId === 'string' ? new ObjectId(userId) : userId;

  const user = await usersCollection.findOne(
    { _id: uid },
    { projection: { referralCode: 1 } }
  );

  if (user?.referralCode) {
    return user.referralCode;
  }

  const newCode = await generateUniqueReferralCode(db);
  await usersCollection.updateOne(
    { _id: uid },
    { $set: { referralCode: newCode } }
  );

  return newCode;
}

/**
 * Validates a referral code during signup.
 * Safeguards:
 * 1. Code must exist in `users`.
 * 2. Self-referral blocked (cannot use own code).
 * 3. Referrer must not have exceeded 5 successful referrals.
 * 4. Existing customer cannot be referred.
 */
export async function validateReferralCode(
  db: Db,
  code: string,
  refereePhone?: string,
  refereeId?: ObjectId | string
): Promise<{
  valid: boolean;
  error?: string;
  referrer?: {
    _id: ObjectId;
    name: string;
    phone: string;
    referralCode: string;
    referralCount: number;
  };
}> {
  if (!code || typeof code !== 'string') {
    return { valid: false, error: 'Referral code is required.' };
  }

  const normalizedCode = code.trim().toUpperCase();
  if (normalizedCode.length !== 6) {
    return { valid: false, error: 'Referral code must be 6 characters long.' };
  }

  const usersCollection = db.collection(USERS_COLLECTION);
  const referrer = await usersCollection.findOne(
    { referralCode: normalizedCode },
    { projection: { _id: 1, name: 1, phone: 1, referralCode: 1, referralCount: 1 } }
  );

  if (!referrer) {
    return { valid: false, error: 'Invalid referral code.' };
  }

  // 1. Self-referral check by phone
  if (refereePhone && referrer.phone === refereePhone) {
    return { valid: false, error: 'You cannot use your own referral code.' };
  }

  // 2. Self-referral check by user ID
  if (refereeId && referrer._id.toString() === refereeId.toString()) {
    return { valid: false, error: 'You cannot use your own referral code.' };
  }

  // 3. Max limit check (Disabled for unlimited referrals)
  const successfulCount = referrer.referralCount || 0;
  if (MAX_REFERRALS_PER_USER !== null && successfulCount >= MAX_REFERRALS_PER_USER) {
    return {
      valid: false,
      error: `This referral code has already reached its maximum limit of ${MAX_REFERRALS_PER_USER} successful invites.`
    };
  }

  // 4. Check if referee already has completed orders (existing customer check)
  if (refereeId) {
    const ordersCollection = db.collection(ORDERS_COLLECTION);
    const existingOrdersCount = await ordersCollection.countDocuments({
      userId: typeof refereeId === 'string' ? new ObjectId(refereeId) : refereeId,
      Status: { $ne: 'Cancelled' }
    });

    if (existingOrdersCount > 0) {
      return { valid: false, error: 'Referral codes are only valid for new customers.' };
    }
  }

  return {
    valid: true,
    referrer: {
      _id: referrer._id,
      name: referrer.name || 'Friend',
      phone: referrer.phone,
      referralCode: referrer.referralCode,
      referralCount: successfulCount,
    }
  };
}

/**
 * Records a pending referral attribution when a new user signs up with a code.
 */
export async function recordReferralSignup(
  db: Db,
  refereeId: ObjectId,
  refereePhone: string,
  referralCode: string,
  metadata?: { ip?: string; refereeName?: string }
): Promise<{ success: boolean; referralId?: ObjectId; error?: string }> {
  const usersCollection = db.collection(USERS_COLLECTION);
  const referralsCollection = db.collection(REFERRALS_COLLECTION);

  // Validate the code first
  const validation = await validateReferralCode(db, referralCode, refereePhone, refereeId);
  if (!validation.valid || !validation.referrer) {
    return { success: false, error: validation.error || 'Invalid code.' };
  }

  const referrer = validation.referrer;

  // Check if referee already has a referral record
  const existingReferral = await referralsCollection.findOne({ refereeId });
  if (existingReferral) {
    return { success: false, error: 'You already have an attributed referral.' };
  }

  // Get referee name if available
  let refereeName = metadata?.refereeName;
  if (!refereeName) {
    const refereeUser = await usersCollection.findOne({ _id: refereeId }, { projection: { name: 1 } });
    if (refereeUser?.name && refereeUser.name !== 'New User') {
      refereeName = refereeUser.name;
    }
  }

  const referralDoc = {
    referrerId: referrer._id,
    referrerPhone: referrer.phone,
    referrerName: referrer.name,
    refereeId: refereeId,
    refereePhone: refereePhone,
    refereeName: refereeName || null,
    referralCode: referralCode.toUpperCase(),
    status: 'pending',
    qualifyingOrderId: null,
    orderAmount: null,
    rewardCredited: null,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const insertResult = await referralsCollection.insertOne(referralDoc);

  // Link attribution in referee's user record
  await usersCollection.updateOne(
    { _id: refereeId },
    {
      $set: {
        referredBy: referrer._id,
        referralAttributionId: insertResult.insertedId,
      }
    }
  );

  return { success: true, referralId: insertResult.insertedId };
}

/**
 * Triggers referral reward processing when an order is finalized as 'Delivered'.
 * Integrates into finalizeDelivery() in order-service.ts.
 */
export async function processReferralOnDelivery(
  client: any,
  db: Db,
  order: any,
  session?: ClientSession
): Promise<void> {
  if (!order || !order.userId) return;

  const refereeId = new ObjectId(order.userId);
  const finalPrice = parseFloat(order.FinalPrice) || 0;

  // 1. Check minimum qualifying order amount (>= 499)
  if (finalPrice < MIN_QUALIFYING_ORDER_AMOUNT) {
    return;
  }

  const referralsCollection = db.collection(REFERRALS_COLLECTION);
  const usersCollection = db.collection(USERS_COLLECTION);
  const transactionsCollection = db.collection(TRANSACTIONS_COLLECTION);
  const ordersCollection = db.collection(ORDERS_COLLECTION);

  // 2. Check if this referee has a referral record pending or qualified
  const referral = await referralsCollection.findOne(
    {
      refereeId,
      status: { $in: ['pending', 'qualified'] }
    },
    { session }
  );

  if (!referral) return;

  // 3. Verify this is the referee's first delivered order
  const deliveredOrdersCount = await ordersCollection.countDocuments(
    {
      userId: refereeId,
      Status: 'Delivered',
      _id: { $ne: new ObjectId(order._id) }
    },
    { session }
  );

  if (deliveredOrdersCount > 0) {
    // Not first delivered order - ignore
    return;
  }

  // 4. Verify Referrer hasn't exceeded max limit (5)
  const referrer = await usersCollection.findOne(
    { _id: referral.referrerId },
    { session }
  );

  if (!referrer) return;

  const currentReferrals = referrer.referralCount || 0;
  if (MAX_REFERRALS_PER_USER !== null && currentReferrals >= MAX_REFERRALS_PER_USER) {
    await referralsCollection.updateOne(
      { _id: referral._id },
      {
        $set: {
          status: 'rejected',
          rejectionReason: `Referrer reached max ${MAX_REFERRALS_PER_USER} referrals cap`,
          updatedAt: new Date()
        }
      },
      { session }
    );
    return;
  }

  // 5. Safe & Legit: Credit Rewards with Idempotency Key
  const idempotencyKey = `ref_reward_${referral._id.toString()}_${order._id.toString()}`;

  // Check idempotency in transactions
  const alreadyCredited = await transactionsCollection.findOne(
    { idempotencyKey },
    { session }
  );
  if (alreadyCredited) return;

  const now = new Date();
  const coinExpiresAt = new Date(now.getTime() + COIN_VALIDITY_DAYS * 24 * 60 * 60 * 1000);

  // A. Credit Referrer (20 Coins)
  await usersCollection.updateOne(
    { _id: referral.referrerId },
    {
      $inc: {
        'wallet.currentBalance': REFERRAL_REWARD_COINS,
        referralCount: 1
      },
      $set: { lastTransactionDate: now }
    },
    { session }
  );

  await transactionsCollection.insertOne(
    {
      userId: referral.referrerId,
      type: 'earn',
      amount: REFERRAL_REWARD_COINS,
      remainingAmount: REFERRAL_REWARD_COINS,
      expiresAt: coinExpiresAt,
      description: `Referral Reward (Order #${order.OrderNumber})`,
      idempotencyKey,
      referralId: referral._id,
      createdAt: now
    },
    { session }
  );

  // B. Credit Referee (20 Coins)
  await usersCollection.updateOne(
    { _id: refereeId },
    {
      $inc: {
        'wallet.currentBalance': REFERRAL_REWARD_COINS
      },
      $set: { lastTransactionDate: now }
    },
    { session }
  );

  await transactionsCollection.insertOne(
    {
      userId: refereeId,
      type: 'earn',
      amount: REFERRAL_REWARD_COINS,
      remainingAmount: REFERRAL_REWARD_COINS,
      expiresAt: coinExpiresAt,
      description: `Welcome Bonus (Referred by ${referrer.name || 'Friend'})`,
      idempotencyKey: `${idempotencyKey}_referee`,
      referralId: referral._id,
      createdAt: now
    },
    { session }
  );

  // C. Update Referral Status to 'rewarded'
  await referralsCollection.updateOne(
    { _id: referral._id },
    {
      $set: {
        status: 'rewarded',
        qualifyingOrderId: new ObjectId(order._id),
        orderAmount: finalPrice,
        rewardCredited: {
          referrerCoins: REFERRAL_REWARD_COINS,
          refereeCoins: REFERRAL_REWARD_COINS,
          creditedAt: now,
          expiresAt: coinExpiresAt
        },
        updatedAt: now
      }
    },
    { session }
  );

  // D. Push Notifications to Both Users
  try {
    // Notify Referrer
    await sendNotificationToUser(
      client,
      referral.referrerId.toString(),
      'Referral Reward! 🎁',
      `Your friend completed their first order! ${REFERRAL_REWARD_COINS} coins added to your wallet.`,
      '',
      '/account/wallet'
    );

    // Notify Referee
    await sendNotificationToUser(
      client,
      refereeId.toString(),
      'Welcome Bonus! 🎉',
      `Congrats on your first order! ${REFERRAL_REWARD_COINS} coins added to your wallet.`,
      '',
      '/account/wallet'
    );
  } catch (err) {
    console.error('Referral notification error:', err);
  }
}

/**
 * Admin manually approves an under_review or pending referral.
 */
export async function approveReferral(
  client: any,
  db: Db,
  referralId: string | ObjectId,
  adminNotes?: string
): Promise<{ success: boolean; error?: string }> {
  const referralsCollection = db.collection(REFERRALS_COLLECTION);
  const usersCollection = db.collection(USERS_COLLECTION);
  const transactionsCollection = db.collection(TRANSACTIONS_COLLECTION);

  const refId = typeof referralId === 'string' ? new ObjectId(referralId) : referralId;
  const referral = await referralsCollection.findOne({ _id: refId });

  if (!referral) {
    return { success: false, error: 'Referral not found.' };
  }

  if (referral.status === 'rewarded') {
    return { success: false, error: 'Referral is already rewarded.' };
  }

  const now = new Date();
  const coinExpiresAt = new Date(now.getTime() + COIN_VALIDITY_DAYS * 24 * 60 * 60 * 1000);
  const idempotencyKey = `ref_reward_manual_${referral._id.toString()}`;

  // Credit Referrer
  await usersCollection.updateOne(
    { _id: referral.referrerId },
    {
      $inc: {
        'wallet.currentBalance': REFERRAL_REWARD_COINS,
        referralCount: 1
      },
      $set: { lastTransactionDate: now }
    }
  );

  await transactionsCollection.insertOne({
    userId: referral.referrerId,
    type: 'earn',
    amount: REFERRAL_REWARD_COINS,
    remainingAmount: REFERRAL_REWARD_COINS,
    expiresAt: coinExpiresAt,
    description: `Referral Reward (Approved by Admin)`,
    idempotencyKey,
    referralId: referral._id,
    createdAt: now
  });

  // Credit Referee
  await usersCollection.updateOne(
    { _id: referral.refereeId },
    {
      $inc: { 'wallet.currentBalance': REFERRAL_REWARD_COINS },
      $set: { lastTransactionDate: now }
    }
  );

  await transactionsCollection.insertOne({
    userId: referral.refereeId,
    type: 'earn',
    amount: REFERRAL_REWARD_COINS,
    remainingAmount: REFERRAL_REWARD_COINS,
    expiresAt: coinExpiresAt,
    description: `Welcome Bonus (Referred by ${referral.referrerName || 'Friend'})`,
    idempotencyKey: `${idempotencyKey}_referee`,
    referralId: referral._id,
    createdAt: now
  });

  await referralsCollection.updateOne(
    { _id: refId },
    {
      $set: {
        status: 'rewarded',
        rewardCredited: {
          referrerCoins: REFERRAL_REWARD_COINS,
          refereeCoins: REFERRAL_REWARD_COINS,
          creditedAt: now,
          expiresAt: coinExpiresAt,
          manuallyApproved: true,
          adminNotes: adminNotes || ''
        },
        updatedAt: now
      }
    }
  );

  try {
    await sendNotificationToUser(
      client,
      referral.referrerId.toString(),
      'Referral Reward! 🎁',
      `Your referral bonus of ${REFERRAL_REWARD_COINS} coins has been credited!`,
      '',
      '/account/wallet'
    );
    await sendNotificationToUser(
      client,
      referral.refereeId.toString(),
      'Welcome Bonus! 🎉',
      `Your welcome bonus of ${REFERRAL_REWARD_COINS} coins has been credited!`,
      '',
      '/account/wallet'
    );
  } catch (err) {
    console.error('Approve referral notification error:', err);
  }

  return { success: true };
}

/**
 * Admin rejects a referral.
 */
export async function rejectReferral(
  db: Db,
  referralId: string | ObjectId,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const referralsCollection = db.collection(REFERRALS_COLLECTION);
  const refId = typeof referralId === 'string' ? new ObjectId(referralId) : referralId;

  const result = await referralsCollection.updateOne(
    { _id: refId },
    {
      $set: {
        status: 'rejected',
        rejectionReason: reason || 'Rejected by Admin',
        updatedAt: new Date()
      }
    }
  );

  if (result.matchedCount === 0) {
    return { success: false, error: 'Referral not found.' };
  }

  return { success: true };
}

/**
 * Admin reverses a previously rewarded referral.
 * Deducts coins from both referrer and referee, and updates referral record.
 */
export async function reverseReferralReward(
  db: Db,
  referralId: string | ObjectId,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const referralsCollection = db.collection(REFERRALS_COLLECTION);
  const usersCollection = db.collection(USERS_COLLECTION);
  const transactionsCollection = db.collection(TRANSACTIONS_COLLECTION);

  const refId = typeof referralId === 'string' ? new ObjectId(referralId) : referralId;
  const referral = await referralsCollection.findOne({ _id: refId });

  if (!referral) {
    return { success: false, error: 'Referral not found.' };
  }

  if (referral.status !== 'rewarded') {
    return { success: false, error: `Cannot reverse referral with status: ${referral.status}` };
  }

  const now = new Date();
  const coinsToDeduct = referral.rewardCredited?.referrerCoins || REFERRAL_REWARD_COINS;

  // 1. Deduct from Referrer
  await usersCollection.updateOne(
    { _id: referral.referrerId },
    {
      $inc: {
        'wallet.currentBalance': -coinsToDeduct,
        referralCount: -1
      },
      $set: { lastTransactionDate: now }
    }
  );

  await transactionsCollection.insertOne({
    userId: referral.referrerId,
    type: 'debit',
    amount: coinsToDeduct,
    description: `Referral Reward Reversed (${reason || 'Admin Reversal'})`,
    referralId: referral._id,
    createdAt: now
  });

  // 2. Deduct from Referee
  await usersCollection.updateOne(
    { _id: referral.refereeId },
    {
      $inc: { 'wallet.currentBalance': -coinsToDeduct },
      $set: { lastTransactionDate: now }
    }
  );

  await transactionsCollection.insertOne({
    userId: referral.refereeId,
    type: 'debit',
    amount: coinsToDeduct,
    description: `Welcome Bonus Reversed (${reason || 'Admin Reversal'})`,
    referralId: referral._id,
    createdAt: now
  });

  // 3. Update Referral Document
  await referralsCollection.updateOne(
    { _id: refId },
    {
      $set: {
        status: 'reversed',
        reversalReason: reason || 'Reversed by Admin',
        reversedAt: now,
        updatedAt: now
      }
    }
  );

  return { success: true };
}

