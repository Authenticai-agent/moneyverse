'use client';

import { useEffect } from 'react';
import Script from 'next/script';

interface TurnstileProps {
  onVerify: (token: string) => void;
}

export default function Turnstile({ onVerify }: TurnstileProps) {
  useEffect(() => {
    const handler = (event: Event) => {
      const token = (event as CustomEvent<string>).detail;
      if (token) onVerify(token);
    };
    window.addEventListener('turnstile-success', handler);
    return () => window.removeEventListener('turnstile-success', handler);
  }, [onVerify]);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!siteKey) return null;

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />
      <div
        className="cf-turnstile"
        data-sitekey={siteKey}
        data-callback="onTurnstileSuccess"
        data-theme="light"
      />
    </>
  );
}

declare global {
  interface Window {
    onTurnstileSuccess?: (token: string) => void;
  }
}

if (typeof window !== 'undefined') {
  window.onTurnstileSuccess = (token) => {
    window.dispatchEvent(new CustomEvent('turnstile-success', { detail: token }));
  };
}
