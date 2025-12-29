// 비밀번호 재설정 이메일 전송 완료 페이지
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Button from '@/components/ui/Button';

export default function ForgotPasswordSentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [isPasswordAlreadyReset, setIsPasswordAlreadyReset] = useState(false);

  // 컴포넌트가 마운트될 때 이메일 파라미터를 가져오고 비밀번호 재설정 상태를 확인
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    } else {
      // 이메일 정보가 없으면 forgot-password 페이지로 리다이렉트
      router.push('/auth/forgot-password');
    }

    // 비밀번호가 이미 재설정되었는지 확인
    const checkPasswordResetStatus = () => {
      const resetCompletedData = localStorage.getItem('passwordResetCompleted');
      if (resetCompletedData && emailParam) {
        try {
          const data = JSON.parse(resetCompletedData);
          
          // 만료되지 않았고 완료된 경우, 그리고 현재 이메일과 일치하는 경우
          if (data.completed &&
              data.expiresAt > Date.now() &&
              data.email === decodeURIComponent(emailParam).toLowerCase()) {
            setIsPasswordAlreadyReset(true);
          } else {
            // 만료된 데이터는 삭제
            if (data.expiresAt <= Date.now())
              localStorage.removeItem('passwordResetCompleted');
          }
        } catch {
          localStorage.removeItem('passwordResetCompleted');
        }
      }
    };

    checkPasswordResetStatus();
  }, [searchParams, router]);

  if (!email) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Header />
        <div className="max-w-md mx-auto px-4 py-12 sm:py-16 text-center">
          <p className="text-base text-neutral-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 비밀번호가 이미 재설정된 경우
  if (isPasswordAlreadyReset) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Header />
        <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
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
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            {/* Success Message */}
            <div className="p-6 rounded-2xl border border-border bg-white dark:bg-neutral-950">
              <h2 className="text-xl font-bold text-foreground mb-2">
                비밀번호가 변경되었습니다
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400">
                새로운 비밀번호로 로그인해주세요.
              </p>
            </div>

            {/* Login Button */}
            <Button
              onClick={() => {
                localStorage.removeItem('passwordResetCompleted');
                router.push('/auth/login');
              }}
              fullWidth
              size="lg"
            >
              로그인하기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />

      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        <div className="text-center space-y-8 animate-[scaleIn_0.4s_ease-out]">
          {/* Success Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-500/30">
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              이메일이 전송되었습니다
            </h1>
            <p className="text-base text-neutral-600 dark:text-neutral-400">
              비밀번호 재설정 링크를 확인해주세요
            </p>
          </div>

          {/* Email Info */}
          <div className="p-6 rounded-2xl border border-border bg-white dark:bg-neutral-950">
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2 text-base text-neutral-600 dark:text-neutral-400">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                <span className="font-medium text-foreground">{email}</span>
              </div>

              <div className="text-base text-neutral-500 dark:text-neutral-400 space-y-2">
                <p className="flex items-start gap-2">
                  <span className="text-primary-500 flex-shrink-0">•</span>
                  <span>메일함에서 비밀번호 재설정 링크를 클릭해주세요</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary-500 flex-shrink-0">•</span>
                  <span>재설정 링크는 24시간 동안 유효합니다</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary-500 flex-shrink-0">•</span>
                  <span>이메일이 도착하지 않았다면 스팸함을 확인해주세요</span>
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={() => router.push('/auth/login')}
              variant="outline"
              fullWidth
              size="lg"
            >
              로그인 페이지로 이동
            </Button>

            <p className="text-center text-base text-neutral-500">
              메일이 오지 않았나요?{' '}
              <a
                href="/auth/forgot-password"
                className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
              >
                다시 시도하기
              </a>
            </p>
          </div>

          {/* Help Text */}
          <div className="pt-8 border-t border-border">
            <p className="text-base text-neutral-500">
              문제가 계속되나요?{' '}
              <a
                href="mailto:support@riff.com"
                className="text-primary-600 dark:text-primary-400 hover:underline cursor-pointer"
              >
                고객센터 문의
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
