'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';

export default function VerifyErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />

      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        <div className="text-center space-y-8 animate-[scaleIn_0.4s_ease-out]">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/30">
              <svg
                className="w-10 h-10 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              인증 실패
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400">
              이메일 인증에 실패했습니다.
              <br />
              인증 링크가 만료되었거나 유효하지 않을 수 있습니다.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={() => router.push('/signup')}
              className="w-full px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors cursor-pointer"
            >
              회원가입 페이지로
            </button>

            <button
              onClick={() => router.push('/')}
              className="w-full px-6 py-3 border border-border text-foreground font-semibold rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors cursor-pointer"
            >
              메인 페이지로
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
