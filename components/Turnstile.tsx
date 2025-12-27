'use client';

import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import Script from 'next/script';

interface TurnstileProps {
  siteKey: string;
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
}

export interface TurnstileHandle {
  reset: () => void;
}

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'error-callback'?: () => void;
          'expired-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
          size?: 'normal' | 'compact';
        }
      ) => string;
      remove: (widgetId: string) => void;
      reset: (widgetId: string) => void;
    };
  }
}

const Turnstile = forwardRef<TurnstileHandle, TurnstileProps>(
  ({ siteKey, onVerify, onError, onExpire }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);

    useImperativeHandle(ref, () => ({
      reset: () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.reset(widgetIdRef.current);
        }
      },
    }));

    useEffect(() => {
      // Cleanup on unmount
      return () => {
        if (widgetIdRef.current && window.turnstile) {
          window.turnstile.remove(widgetIdRef.current);
        }
      };
    }, []);

    const handleScriptLoad = () => {
      if (!containerRef.current || !window.turnstile) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onVerify,
        'error-callback': onError,
        'expired-callback': onExpire,
        theme: 'auto',
        size: 'normal',
      });
    };

    return (
      <>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          onLoad={handleScriptLoad}
          strategy="lazyOnload"
        />
        <div ref={containerRef} />
      </>
    );
  }
);

Turnstile.displayName = 'Turnstile';

export default Turnstile;
