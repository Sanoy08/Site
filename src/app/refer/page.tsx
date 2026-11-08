'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';

function ReferContent() {
  const searchParams = useSearchParams();
  const code = (searchParams.get('code') || '').toUpperCase().trim();
  const [copied, setCopied] = useState(false);

  const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.bumbaskitchen.app';
  const appSchemeUrl = `bumbaskitchenapp://refer?code=${code}`;
  const androidIntentUrl = `intent://refer?code=${code}#Intent;scheme=bumbaskitchenapp;package=com.bumbaskitchen.app;end`;

  useEffect(() => {
    if (!code) return;

    // Auto-attempt redirect to app on mobile devices
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const isAndroid = /android/i.test(userAgent);
    const isIOS = /iphone|ipad|ipod/i.test(userAgent);

    if (isAndroid) {
      window.location.href = androidIntentUrl;
    } else if (isIOS) {
      window.location.href = appSchemeUrl;
    }
  }, [code, androidIntentUrl, appSchemeUrl]);

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenApp = () => {
    const isAndroid = /android/i.test(navigator.userAgent);
    if (isAndroid) {
      window.location.href = androidIntentUrl;
    } else {
      window.location.href = appSchemeUrl;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-gray-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden text-center p-6 sm:p-8">
        {/* Brand Header */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center text-3xl shadow-inner">
            🍲
          </div>
        </div>

        <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">
          Bumba&apos;s Kitchen
        </h1>
        <p className="text-sm font-semibold text-rose-600 mb-6 uppercase tracking-wider">
          Exclusive Referral Invitation
        </p>

        {/* Reward Card */}
        <div className="bg-gradient-to-br from-rose-600 to-rose-700 text-white rounded-2xl p-5 mb-6 shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <span className="inline-block bg-amber-400 text-amber-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider mb-2">
              🎁 Welcome Bonus
            </span>
            <h2 className="text-xl font-bold mb-1">Get 50 Free Coins</h2>
            <p className="text-xs text-rose-100 font-medium">
              Join with this referral code and earn 50 Coins on your 1st order of ₹499 or more!
            </p>
          </div>
        </div>

        {/* Referral Code Display */}
        {code ? (
          <div className="mb-6">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
              Your Referral Code
            </p>
            <div
              onClick={handleCopyCode}
              role="button"
              className="cursor-pointer border-2 border-dashed border-rose-300 bg-rose-50/60 rounded-xl py-3 px-4 flex items-center justify-between hover:bg-rose-50 transition"
            >
              <span className="text-2xl font-black text-rose-700 tracking-widest font-mono">
                {code}
              </span>
              <button
                type="button"
                className="bg-rose-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm hover:bg-rose-700 transition"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            {copied && (
              <p className="text-[11px] text-green-600 font-semibold mt-1.5">
                Code copied! Paste it during signup.
              </p>
            )}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleOpenApp}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-6 rounded-xl shadow-md transition flex items-center justify-center space-x-2"
          >
            <span>Open in App</span>
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>

          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-gray-900 hover:bg-black text-white font-bold py-3.5 px-6 rounded-xl transition flex items-center justify-center space-x-2 block"
          >
            <span>Download on Google Play</span>
          </a>
        </div>

        {/* 3 Step Guide */}
        <div className="mt-8 pt-6 border-t border-gray-100 text-left">
          <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-3">
            How to claim your bonus:
          </p>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex items-start">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center mr-2 flex-shrink-0 text-[10px]">
                1
              </span>
              <span>Open or install the Bumba&apos;s Kitchen app.</span>
            </div>
            <div className="flex items-start">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center mr-2 flex-shrink-0 text-[10px]">
                2
              </span>
              <span>Enter referral code <strong>{code || 'from friend'}</strong> during signup.</span>
            </div>
            <div className="flex items-start">
              <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 font-bold flex items-center justify-center mr-2 flex-shrink-0 text-[10px]">
                3
              </span>
              <span>Place your 1st order (min ₹499) to get 50 Coins in your wallet instantly upon delivery!</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReferPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-rose-600"></div>
        </div>
      }
    >
      <ReferContent />
    </Suspense>
  );
}

