// 비밀번호 재설정 에러 페이지
'use client';

import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Button from '@/components/ui/Button';

export default function ResetPasswordErrorPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />
      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
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

          {/* Error Message */}
          <div className="p-6 rounded-2xl border border-border bg-white dark:bg-neutral-950">
            <h2 className="text-xl font-bold text-foreground mb-2">
              링크가 만료되었습니다
            </h2>
            <p className="text-base text-neutral-600 dark:text-neutral-400 mb-4">
              비밀번호 재설정 링크가 만료되었거나 유효하지 않습니다.
            </p>
            <div className="text-sm text-neutral-500 dark:text-neutral-400 space-y-2">
              <p className="flex items-start gap-2">
                <span className="text-primary-500 flex-shrink-0">•</span>
                <span>재설정 링크는 24시간 동안만 유효합니다</span>
              </p>
              <p className="flex items-start gap-2">
                <span className="text-primary-500 flex-shrink-0">•</span>
                <span>이미 사용한 링크는 재사용할 수 없습니다</span>
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/auth/forgot-password')}
              fullWidth
              size="lg"
            >
              비밀번호 찾기 다시 시도
            </Button>
            <Button
              onClick={() => router.push('/auth/login')}
              variant="outline"
              fullWidth
              size="lg"
            >
              로그인 페이지로 이동
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
