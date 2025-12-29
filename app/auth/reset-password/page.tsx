// 비밀번호 재설정 페이지
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/Header';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authApi } from '@/lib/api/auth';
import type { ApiError } from '@/lib/api/types';

interface FormErrors {
  password?: string;
  passwordConfirm?: string;
  general?: string;
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isValidToken, setIsValidToken] = useState(true);
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // 토큰 유효성 검사
  useEffect(() => {
    const checkToken = async () => {
      if (!token) {
        setIsValidToken(false);
        setIsCheckingToken(false);
        return;
      }

      try {
        // API 연동 - 토큰 유효성 검사
        const response = await authApi.verifyResetToken({ token });
        setIsValidToken(true);
        // 이메일 정보 저장 (API 응답에서)
        if (response.email) {
          setUserEmail(response.email);
        }
      } catch (error) {
        console.error('Token verification failed:', error);
        setIsValidToken(false);
      } finally {
        setIsCheckingToken(false);
      }
    };

    checkToken();
  }, [token]);

  // 비밀번호 유효성 검사
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) {
      return '비밀번호는 최소 8자 이상이어야 합니다';
    }
    if (!/[A-Z]/.test(password)) {
      return '비밀번호는 최소 1개의 대문자를 포함해야 합니다';
    }
    if (!/[a-z]/.test(password)) {
      return '비밀번호는 최소 1개의 소문자를 포함해야 합니다';
    }
    if (!/[0-9]/.test(password)) {
      return '비밀번호는 최소 1개의 숫자를 포함해야 합니다';
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return '비밀번호는 최소 1개의 특수문자를 포함해야 합니다';
    }
    return null;
  };

  // 비밀번호 재설정 처리
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: FormErrors = {};

    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else {
      const passwordError = validatePassword(password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }

    if (!passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호 확인을 입력해주세요';
    } else if (password !== passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않습니다';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // API 연동 - 비밀번호 재설정
      if (!token) {
        throw new Error('토큰이 없습니다.');
      }

      const response = await authApi.resetPassword({
        resetToken: token,
        newPassword: password,
      });

      // 비밀번호 재설정 완료 플래그 저장 (24시간 유지, 이메일별)
      if (userEmail) {
        const resetCompletedData = {
          completed: true,
          email: userEmail.toLowerCase(), // 소문자로 정규화
          timestamp: Date.now(),
          expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24시간
        };
        localStorage.setItem('passwordResetCompleted', JSON.stringify(resetCompletedData));
      }

      setSuccessMessage(response.message || '비밀번호가 성공적으로 재설정되었습니다.');
    } catch (error: any) {
      const apiError = error as ApiError;
      setErrors({
        general: apiError.message || '비밀번호 재설정에 실패했습니다. 잠시 후 다시 시도해주세요.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 토큰 확인 중
  if (isCheckingToken) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Header />
        <div className="max-w-md mx-auto px-4 py-12 sm:py-16 text-center">
          <p className="text-base text-neutral-500">확인 중...</p>
        </div>
      </div>
    );
  }

  // 유효하지 않은 토큰
  if (!isValidToken) {
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
                유효하지 않은 링크입니다
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

  // 재설정 성공
  if (successMessage) {
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
                비밀번호가 재설정되었습니다
              </h2>
              <p className="text-base text-neutral-600 dark:text-neutral-400">
                새로운 비밀번호로 로그인해주세요.
              </p>
            </div>

            {/* Login Button */}
            <Button
              onClick={() => router.push('/auth/login')}
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

  // 비밀번호 재설정 폼
  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />

      <div className="max-w-md mx-auto px-4 py-12 sm:py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            새 비밀번호 설정
          </h1>
          <p className="text-base text-neutral-500 dark:text-neutral-400">
            새로운 비밀번호를 입력해주세요
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-white dark:bg-neutral-950">
            <div className="space-y-4">
              {/* Password Input */}
              <div>
                <Input
                  label="새 비밀번호"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="새 비밀번호"
                  error={errors.password}
                  fullWidth
                  autoComplete="new-password"
                />
              </div>

              {/* Password Confirm Input */}
              <div>
                <Input
                  label="새 비밀번호 확인"
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="새 비밀번호 확인"
                  error={errors.passwordConfirm}
                  fullWidth
                  autoComplete="new-password"
                />
              </div>

              {/* Password Requirements */}
              <div className="pt-2">
                <p className="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                  비밀번호 요구사항:
                </p>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 space-y-1">
                  <p className="flex items-center gap-2">
                    <span className="text-primary-500">•</span>
                    <span>최소 8자 이상</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-primary-500">•</span>
                    <span>대문자, 소문자, 숫자, 특수문자 각 1개 이상 포함</span>
                  </p>
                </div>
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
            {isSubmitting ? '재설정 중...' : '비밀번호 재설정'}
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
