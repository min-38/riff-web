'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Button from '@/components/ui/Button';
import Turnstile, { type TurnstileHandle } from '@/components/Turnstile';
import { authApi, type ApiError } from '@/lib/api';

const RESEND_COOLDOWN = 60; // 60초
const CAPTCHA_REQUIRED_ATTEMPTS = 3; // 3번째 시도부터 CAPTCHA 필요
const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'; // Test key

export default function VerifyEmailSentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sentTime, setSentTime] = useState<Date | null>(null);
  const [resendCount, setResendCount] = useState(0);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const turnstileRef = useRef<TurnstileHandle>(null);

  // 인증 토큰 유효성 체크 함수
  const checkTokenValidity = async () => {
    if (!token) return false;

    try {
      const response = await authApi.getVerificationInfo({ verificationToken: token });
      setEmail(response.email);
      setSentTime(new Date());
      setCooldown(response.remainingCooldown || 0);
      return true;
    } catch (err) {
      const apiError = err as ApiError;

      // 이미 인증이 완료된 경우
      if (apiError.message?.includes('Invalid or expired verification token')) {
        setMessage('이메일 인증이 완료되었습니다! 메인 페이지로 이동합니다...');
        setTimeout(() => router.push('/'), 2000);
        return false;
      }

      setError('인증 정보를 불러올 수 없습니다. 다시 시도해주세요.');
      setTimeout(() => router.push('/'), 3000);
      return false;
    }
  };

  // 인증 토큰으로 이메일 정보 가져오기
  useEffect(() => {
    const fetchVerificationInfo = async () => {
      if (!token) {
        router.push('/');
        return;
      }

      await checkTokenValidity();
      setIsLoading(false);
    };

    fetchVerificationInfo();
  }, [token, router]);

  // 주기적으로 토큰 유효성 체크
  useEffect(() => {
    if (!token || isLoading) return;

    const interval = setInterval(() => {
      checkTokenValidity();
    }, 10000); // 10초마다

    return () => clearInterval(interval);
  }, [token, isLoading]);

  // 탭 포커스 시 토큰 유효성 체크
  useEffect(() => {
    if (!token || isLoading) return;

    const handleFocus = () => {
      checkTokenValidity();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [token, isLoading]);

  // 재전송 쿨다운 타이머
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => {
        setCooldown(cooldown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // 날짜 포맷팅 함수
  const formatSentTime = (date: Date | null) => {
    if (!date) return '';

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}년 ${month}월 ${day}일 ${hours}:${minutes}:${seconds}`;
  };

  const handleResend = async () => {
    if (!token) {
      setError('인증 토큰을 찾을 수 없습니다');
      return;
    }

    // 3번째 시도부터 CAPTCHA 필요
    if (resendCount >= CAPTCHA_REQUIRED_ATTEMPTS - 1) {
      if (!captchaToken) {
        setShowCaptcha(true);
        setError('재전송 횟수가 많아 보안 확인이 필요합니다. 아래 인증을 완료해주세요.');
        return;
      }
    }

    setIsResending(true);
    setError('');
    setMessage('');

    try {
      await authApi.resendVerification({
        verificationToken: token,
        captchaToken: captchaToken || undefined,
      });

      setMessage('인증 메일이 재전송되었습니다');
      setSentTime(new Date());
      setCooldown(RESEND_COOLDOWN);
      setResendCount((prev) => prev + 1);

      // CAPTCHA 위젯 리셋 (다음 재전송 시 새로 받아야 함)
      setCaptchaToken(null);
      if (turnstileRef.current) {
        turnstileRef.current.reset();
      }
    } catch (err) {
      const apiError = err as ApiError;

      // 이미 인증이 완료된 경우
      if (apiError.message?.includes('Invalid or expired verification token')) {
        setMessage('이메일 인증이 완료되었습니다! 메인 페이지로 이동합니다...');
        setError('');
        setTimeout(() => router.push('/'), 2000);
        return;
      }

      // Rate limit (429) 에러 처리
      if (apiError.status === 429) {
        const message = apiError.message || '';
        if (message.includes('today') || message.includes('tomorrow')) {
          setError('오늘 재전송 횟수를 초과했습니다. 내일 다시 시도해주세요.');
        } else {
          setError('재전송 횟수를 초과했습니다. 1시간 후에 다시 시도해주세요.');
        }
      } else if (apiError.message?.includes('CAPTCHA')) {
        setShowCaptcha(true);
        setError('보안 확인이 필요합니다. 아래 인증을 완료해주세요.');
      } else {
        setError(apiError.message || '메일 재전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }

      // 에러 발생 시 CAPTCHA 토큰 초기화
      setCaptchaToken(null);
    } finally {
      setIsResending(false);
    }
  };

  const handleCaptchaVerify = (token: string) => {
    setCaptchaToken(token);
    setError('');
  };

  const handleCaptchaError = () => {
    setCaptchaToken(null);
    setError('보안 확인 중 오류가 발생했습니다. 다시 시도해주세요.');
  };

  // 재전송 횟수 체크 후 CAPTCHA 표시
  useEffect(() => {
    if (resendCount >= CAPTCHA_REQUIRED_ATTEMPTS - 1) {
      setShowCaptcha(true);
    }
  }, [resendCount]);

  // 인증할 때 로딩 중 표시
  if (isLoading) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Header />
        <div className="max-w-md mx-auto px-4 py-12 sm:py-16 text-center">
          <p className="text-base text-neutral-500">인증 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 로딩 실패 시 에러 표시
  if (!email) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Header />
        <div className="max-w-md mx-auto px-4 py-12 sm:py-16 text-center space-y-4">
          <p className="text-base text-red-600 dark:text-red-400">{error || '인증 정보를 불러올 수 없습니다'}</p>
          <p className="text-sm text-neutral-500">잠시 후 홈페이지로 이동합니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />

      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        <div className="text-center space-y-8 animate-[scaleIn_0.4s_ease-out]">
          {/* Icon */}
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
              인증 메일이 전송되었습니다
            </h1>
            {sentTime && (
              <p className="text-sm text-neutral-500 dark:text-neutral-500 mb-3">
                전송 시간: {formatSentTime(sentTime)}
              </p>
            )}
            <p className="text-base text-neutral-600 dark:text-neutral-400">
              이메일 인증을 완료하면 서비스를 이용하실 수 있습니다
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
                  <span>메일함에서 인증 링크를 클릭해주세요</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary-500 flex-shrink-0">•</span>
                  <span>인증 링크는 24시간 동안 유효합니다</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary-500 flex-shrink-0">•</span>
                  <span>스팸함도 확인해주세요</span>
                </p>
                <p className="flex items-start gap-2">
                  <span className="text-primary-500 flex-shrink-0">•</span>
                  <span className="text-sm">재전송은 1시간에 5회, 하루 15회까지 가능합니다</span>
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

          {/* Resend Button */}
          <div className="space-y-3">
            <Button
              onClick={handleResend}
              disabled={isResending || cooldown > 0 || (showCaptcha && !captchaToken)}
              variant="outline"
              fullWidth
              size="lg"
            >
              {cooldown > 0
                ? `재전송 가능 (${cooldown}초)`
                : isResending
                ? '전송 중...'
                : '인증 메일 재전송'}
            </Button>

            {message && (
              <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                <p className="text-base text-green-600 dark:text-green-400">{message}</p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <p className="text-base text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}
          </div>

          {/* Help Text */}
          <div className="pt-8 border-t border-border">
            <p className="text-base text-neutral-500">
              메일이 오지 않았나요?{' '}
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
