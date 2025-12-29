// 비밀번호 찾기 페이지
'use client';

import { useState, useRef, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Turnstile, { type TurnstileHandle } from '@/components/Turnstile';
import { authApi } from '@/lib/api';
import type { ApiError } from '@/lib/api/types';

const CAPTCHA_REQUIRED_ATTEMPTS = 3; // 3번째 시도부터 CAPTCHA 필요
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // Test key

interface FormErrors {
  email?: string;
  general?: string;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const turnstileRef = useRef<TurnstileHandle>(null);

  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitCount, setSubmitCount] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);

  // 이메일 유효성 검사
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 제출 횟수에 따라 CAPTCHA 표시
  useEffect(() => {
    if (submitCount >= CAPTCHA_REQUIRED_ATTEMPTS - 1) {
      setShowCaptcha(true);
    }
  }, [submitCount]);

  // CAPTCHA 콜백
  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setErrors((prev) => ({ ...prev, general: undefined }));
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    setErrors({
      general: '보안 확인 중 오류가 발생했습니다. 다시 시도해주세요.'
    });
  };

  // 비밀번호 재설정 이메일 전송
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();


    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!validateEmail(email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // 3번째 시도부터 CAPTCHA 필요
    if (submitCount >= CAPTCHA_REQUIRED_ATTEMPTS - 1) {
      if (!captchaToken) {
        setShowCaptcha(true);
        setErrors({
          general: '전송 횟수가 많아 보안 확인이 필요합니다. 아래 인증을 완료해주세요.'
        });
        return;
      }
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // API 호출
      const response = await authApi.forgotPassword({
        email,
        captchaToken: captchaToken || undefined,
      });

      // 성공 시 submit count 증가
      setSubmitCount((prev) => prev + 1);

      // 성공 시 정적 페이지로 리다이렉트 (이메일 정보 포함)
      router.push(`/auth/forgot-password-sent?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      const apiError = error as ApiError;

      // Rate limit 에러 (429) 처리
      if (apiError.status === 429) {
        const retryAfter = apiError.retryAfter || 3600;
        const hours = Math.floor(retryAfter / 3600);
        const minutes = Math.floor((retryAfter % 3600) / 60);

        let timeMessage = '';
        if (hours > 0) {
          timeMessage = `${hours}시간`;
          if (minutes > 0) timeMessage += ` ${minutes}분`;
        } else {
          timeMessage = `${minutes}분`;
        }

        setErrors({
          general: apiError.message || `전송 횟수를 초과하여 ${timeMessage} 동안 차단되었습니다. 잠시 후 다시 시도해주세요.`
        });
      } else {
        // CAPTCHA 필요 에러 처리
        if (apiError.message?.includes('CAPTCHA') || apiError.message?.includes('보안 확인')) {
          setShowCaptcha(true);
          setErrors({
            general: apiError.message
          });
        } else {
          // 일반 에러 처리
          setErrors({
            general: apiError.message || '비밀번호 재설정 요청에 실패했습니다. 잠시 후 다시 시도해주세요.'
          });
        }
      }

      // 에러 발생 시 submit count 증가 (CAPTCHA 표시를 위해)
      setSubmitCount((prev) => prev + 1);

      // 에러 발생 시 CAPTCHA 토큰 초기화
      setCaptchaToken(null);
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }

      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />

      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            비밀번호 찾기
          </h1>
          <p className="text-base text-neutral-500 dark:text-neutral-400">
            가입하신 이메일 주소를 입력해주세요
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
              <div className="p-6 rounded-2xl border border-border bg-white dark:bg-neutral-950">
                <div className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <Input
                      label="이메일"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="이메일 주소"
                      error={errors.email}
                      fullWidth
                      autoComplete="email"
                    />
                  </div>

                  {/* Info Text */}
                  <div className="pt-2">
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      입력하신 이메일 주소로 비밀번호 재설정 링크를 보내드립니다.
                    </p>
                  </div>
                </div>
              </div>

              {/* CAPTCHA (3번째 시도부터) */}
              {showCaptcha && (
                <div className="p-4 rounded-xl border border-border bg-white dark:bg-neutral-950">
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                    보안을 위해 아래 인증을 완료해주세요
                  </p>
                  <div className="flex justify-center">
                    <Turnstile
                      ref={turnstileRef}
                      siteKey={TURNSTILE_SITE_KEY}
                      onVerify={handleCaptchaVerify}
                      onError={handleCaptchaError}
                      onExpire={() => setCaptchaToken(null)}
                    />
                  </div>
                </div>
              )}

              {/* General Error */}
              {errors.general && (
                <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                  <p className="text-base text-red-600 dark:text-red-400">{errors.general}</p>
                </div>
              )}

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={isSubmitting || (showCaptcha && !captchaToken)}
                fullWidth
                size="lg"
              >
                {isSubmitting ? '전송 중...' : '비밀번호 재설정 링크 받기'}
              </Button>
            </form>

        {/* Back to Login Link */}
        <div className="mt-6">
          <p className="text-center text-base text-neutral-500">
            <a
              href="/auth/login"
              className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:underline cursor-pointer"
            >
              로그인으로 돌아가기
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
