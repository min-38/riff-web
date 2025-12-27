'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { getRedirectAfterAuth } from '@/lib/auth/redirect';
import { setTokens } from '@/lib/auth/token';

export default function VerifySuccessPage() {
  const router = useRouter();

  useEffect(() => {
    // fragment에서 토큰 읽기
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    // 토큰이 있으면 저장
    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);

      // URL에서 Fragment 제거
      window.history.replaceState(null, '', window.location.pathname);
    }

    // 2초 후 이전 페이지 또는 메인으로 리다이렉트
    const timer = setTimeout(() => {
      const redirectPath = getRedirectAfterAuth();
      router.push(redirectPath);
    }, 2000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />

      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        <div className="text-center space-y-8 animate-[scaleIn_0.4s_ease-out]">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              인증 완료!
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              환영합니다! 잠시 후 이동합니다...
            </p>
          </div>

          {/* Message */}
          <div className="p-6 rounded-2xl border border-border bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              이메일 인증이 성공적으로 완료되었습니다.
              <br />
              이제 모든 서비스를 이용하실 수 있습니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
