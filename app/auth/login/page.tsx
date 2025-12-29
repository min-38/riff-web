// 로그인 페이지 컴포넌트
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authApi, type ApiError } from '@/lib/api';
import { setTokens, getRememberMe, isAuthenticated } from '@/lib/auth/token';
import { getRedirectAfterAuth } from '@/lib/auth/redirect';

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

export default function LoginPage() {
  const router = useRouter();

  // 폼 상태
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 이미 로그인된 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  // 이전 로그인 유지 설정 불러오기
  useEffect(() => {
    setRememberMe(getRememberMe());
  }, []);

  // 이메일 유효성 검사
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 로그인 처리
  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: FormErrors = {};

    if (!email)
      newErrors.email = '이메일을 입력해주세요';
    else if (!validateEmail(email))
      newErrors.email = '올바른 이메일 형식이 아닙니다';

    if (!password)
      newErrors.password = '비밀번호를 입력해주세요';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await authApi.login({
        email,
        password,
      });

      // 토큰이 있으면 저장 (로그인 유지 설정 포함)
      if (response.token && response.refreshToken) {
        setTokens(response.token, response.refreshToken, rememberMe);
      }

      // 이메일 인증이 안 된 경우
      if (!response.verified) {
        setErrors({
          general: '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.'
        });
        setIsSubmitting(false);
        return;
      }

      // 로그인 성공 - localStorage 정리
      localStorage.removeItem('passwordResetCompleted');

      // 이전 페이지 또는 메인으로 리다이렉트
      const redirectPath = getRedirectAfterAuth();
      router.push(redirectPath);
    } catch (error) {
      const apiError = error as ApiError;

      // 미인증 계정 - 인증 이메일 페이지로 리다이렉트
      if (apiError.status === 403 && apiError.verificationToken) {
        router.push(`/auth/verify-email-sent?token=${apiError.verificationToken}`);
        return;
      }

      // 차단된 계정
      if (apiError.message?.includes('blocked')) {
        setErrors({
          general: apiError.message
        });
      } else if (apiError.message?.includes('Invalid credentials') ||
          apiError.message?.includes('이메일') ||
          apiError.message?.includes('비밀번호')) {
        setErrors({
          general: '이메일 또는 비밀번호가 올바르지 않습니다.'
        });
      } else if (apiError.message?.includes('verified') ||
                 apiError.message?.includes('인증')) {
        setErrors({
          general: '이메일 인증이 완료되지 않았습니다. 이메일을 확인해주세요.'
        });
      } else {
        setErrors({
          general: apiError.message || '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // 인증 상태 확인 중이면 로딩 표시
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Header />
        <div className="max-w-md mx-auto px-4 py-12 sm:py-16 text-center">
          <p className="text-base text-neutral-500">로딩 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />

      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            로그인
          </h1>
          <p className="text-base text-neutral-500 dark:text-neutral-400">
            Riff에 오신 것을 환영합니다
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
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

              {/* Password Input */}
              <div>
                <Input
                  label="비밀번호"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="비밀번호"
                  error={errors.password}
                  fullWidth
                  autoComplete="current-password"
                />
              </div>

              {/* Remember Me Checkbox */}
              <div className="pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-neutral-300 dark:border-neutral-700 text-primary-600 focus:ring-primary-500"
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                    로그인 유지
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* General Error */}
          {errors.general && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-base text-red-600 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isSubmitting}
            fullWidth
            size="lg"
          >
            {isSubmitting ? '로그인 중...' : '로그인'}
          </Button>
        </form>

        {/* Additional Links */}
        <div className="mt-6 space-y-4">
          {/* Forgot Password Link */}
          <p className="text-center text-base text-neutral-500">
            <a
              href="/auth/forgot-password"
              className="text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 hover:underline cursor-pointer"
            >
              비밀번호를 잊으셨나요?
            </a>
          </p>

          {/* Signup Link */}
          <p className="text-center text-base text-neutral-500">
            아직 계정이 없으신가요?{' '}
            <a
              href="/auth/signup"
              className="text-primary-600 dark:text-primary-400 font-medium hover:underline cursor-pointer"
            >
              회원가입
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
