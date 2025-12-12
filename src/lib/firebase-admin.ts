import admin from 'firebase-admin';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Handle private key newlines correctly
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const messaging = admin.messaging();
export const auth = admin.auth();

// ★ HELPER: Verify User Token from Request Headers
export async function verifyAuth(request: Request) {
  const token = request.headers.get('authorization')?.split('Bearer ')[1];
  
  if (!token) return null;

  try {
    const decodedToken = await auth.verifyIdToken(token);
    return decodedToken; // Returns object with uid, email, etc.
  } catch (error) {
    console.error("Auth verification failed:", error);
    return null;
  }
}