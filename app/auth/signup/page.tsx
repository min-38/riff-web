'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/Header';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { authApi, type ApiError } from '@/lib/api';
import { TermsOfServiceContent, PrivacyCollectionContent } from '@/lib/terms';
import { isAuthenticated } from '@/lib/auth/token';

interface FormErrors {
  email?: string;
  nickname?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

type ValidationStatus = 'idle' | 'checking' | 'available' | 'unavailable';

export default function SignupPage() {
  const router = useRouter();

  // 폼 상태
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // 체크박스 상태 관리
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacyCollectAccount, setAgreePrivacyCollectAccount] = useState(false);
  const [agreeMarketingEmail, setAgreeMarketingEmail] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // 유효성 상태
  const [emailStatus, setEmailStatus] = useState<ValidationStatus>('idle');
  const [nicknameStatus, setNicknameStatus] = useState<ValidationStatus>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // 이메일 유효성 검사
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // 비밀번호 유효성 검사
  const validatePassword = (password: string): string | null => {
    if (password.length < 8) return '비밀번호는 최소 8자 이상이어야 합니다';
    if (!/[a-z]/.test(password)) return '비밀번호에 영문 소문자를 포함해주세요';
    if (!/[A-Z]/.test(password)) return '비밀번호에 영문 대문자를 포함해주세요';
    if (!/[0-9]/.test(password)) return '비밀번호에 숫자를 포함해주세요';
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return '비밀번호에 특수문자를 포함해주세요';
    return null;
  };

  // 이미 로그인된 경우 메인 페이지로 리다이렉트
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  // 이메일 자동 중복 확인 
  useEffect(() => {
    if (!email) {
      setEmailStatus('idle');
      setErrors((prev) => ({ ...prev, email: undefined }));
      return;
    }

    if (!validateEmail(email)) {
      setEmailStatus('idle');
      setErrors((prev) => ({ ...prev, email: '올바른 이메일 형식이 아닙니다' }));
      return;
    }

    // 형식이 올바르면 즉시 에러 메시지 제거
    setErrors((prev) => ({ ...prev, email: undefined }));

    const timeoutId = setTimeout(async () => {
      setEmailStatus('checking');

      try {
        const response = await authApi.checkEmail({ email });

        if (response.available) {
          setEmailStatus('available');
        } else {
          setEmailStatus('unavailable');
          setErrors((prev) => ({ ...prev, email: '이미 사용 중인 이메일입니다' }));
        }
      } catch (error) {
        setEmailStatus('idle');
        const apiError = error as ApiError;
        setErrors((prev) => ({
          ...prev,
          email: '이메일 확인에 실패했습니다. 잠시 후 다시 시도해주세요.'
        }));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [email]);

  // 닉네임 자동 중복 확인
  useEffect(() => {
    if (!nickname) {
      setNicknameStatus('idle');
      setErrors((prev) => ({ ...prev, nickname: undefined }));
      return;
    }

    if (nickname.length < 2) {
      setNicknameStatus('idle');
      setErrors((prev) => ({ ...prev, nickname: '닉네임은 2자 이상이어야 합니다' }));
      return;
    }

    if (nickname.length > 15) {
      setNicknameStatus('idle');
      setErrors((prev) => ({ ...prev, nickname: '닉네임은 15자 이하여야 합니다' }));
      return;
    }

    // 길이가 올바르면 즉시 에러 메시지 제거
    setErrors((prev) => ({ ...prev, nickname: undefined }));

    const timeoutId = setTimeout(async () => {
      setNicknameStatus('checking');

      try {
        const response = await authApi.checkNickname(nickname);

        if (response.available) {
          setNicknameStatus('available');
        } else {
          setNicknameStatus('unavailable');
          setErrors((prev) => ({ ...prev, nickname: '이미 사용 중인 닉네임입니다' }));
        }
      } catch (error) {
        setNicknameStatus('idle');
        const apiError = error as ApiError;
        setErrors((prev) => ({
          ...prev,
          nickname: '닉네임 확인에 실패했습니다. 잠시 후 다시 시도해주세요.'
        }));
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [nickname]);

  // 패스워드 유효성 자동 검사
  useEffect(() => {
    if (!password) {
      setErrors((prev) => ({ ...prev, password: undefined }));
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setErrors((prev) => ({ ...prev, password: passwordError }));
    } else {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  }, [password]);

  // 비밀번호 확인 자동 검사
  useEffect(() => {
    if (!confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
      return;
    }

    if (password !== confirmPassword) {
      setErrors((prev) => ({ ...prev, confirmPassword: '비밀번호가 일치하지 않습니다' }));
    } else {
      setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  }, [password, confirmPassword]);

  // 회원가입 처리
  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors: FormErrors = {};

    if (!email) {
      newErrors.email = '이메일을 입력해주세요';
    } else if (!validateEmail(email)) {
      newErrors.email = '올바른 이메일 주소를 입력해주세요';
    } else if (emailStatus !== 'available') {
      newErrors.email = '사용 가능한 이메일을 입력해주세요';
    }

    if (!nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요';
    } else if (nickname.length < 2 || nickname.length > 15) {
      newErrors.nickname = '닉네임은 2-15자 사이여야 합니다';
    } else if (nicknameStatus !== 'available') {
      newErrors.nickname = '사용 가능한 닉네임을 입력해주세요';
    }

    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요';
    } else {
      const passwordError = validatePassword(password);
      if (passwordError) {
        newErrors.password = passwordError;
      }
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다';
    }

    if (!agreeTerms || !agreePrivacyCollectAccount) {
      newErrors.general = '필수 약관에 동의해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const response = await authApi.register({
        email,
        password,
        passwordConfirm: confirmPassword,
        nickname,
        termsOfServiceAgreed: agreeTerms,
        privacyPolicyAgreed: agreePrivacyCollectAccount,
        marketingAgreed: agreeMarketingEmail,
      });

      // 성공하면 이메일 인증 페이지로 이동
      if (response.verificationToken)
        router.push(`/auth/verify-email-sent?token=${response.verificationToken}`);
      else
        setErrors({ general: '회원가입에 성공했지만 인증 페이지로 이동할 수 없습니다. 로그인을 시도해주세요.' });
    } catch (error) {
      const apiError = error as ApiError;
      const fieldErrors: FormErrors = {};

      if (apiError.errors && apiError.errors.length > 0) {
        apiError.errors.forEach((err: string) => {
          const lowerErr = err.toLowerCase();
          if (lowerErr.includes('nickname')) {
            fieldErrors.nickname = err;
          } else if (lowerErr.includes('email')) {
            fieldErrors.email = err;
          } else if (lowerErr.includes('password')) {
            fieldErrors.password = err;
          } else {
            fieldErrors.general = err;
          }
        });
      } else {
        fieldErrors.general = apiError.message || '회원가입에 실패했습니다. 잠시 후 다시 시도해주세요.';
      }

      setErrors(fieldErrors);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 유효성 상태 표시기 헬퍼
  const getValidationIndicator = (status: ValidationStatus) => {
    switch (status) {
      case 'checking':
        return { text: '확인 중...', color: 'text-neutral-500' };
      case 'available':
        return { text: '✓ 사용 가능', color: 'text-green-600 dark:text-green-400' };
      default:
        return null;
    }
  };

  // 패스워드 요구사항 확인 헬퍼
  const getPasswordRequirements = () => {
    return [
      { label: '8자 이상', met: password.length >= 8 },
      { label: '영문 소문자 포함', met: /[a-z]/.test(password) },
      { label: '영문 대문자 포함', met: /[A-Z]/.test(password) },
      { label: '숫자 포함', met: /[0-9]/.test(password) },
      { label: '특수문자 포함', met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) },
    ];
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
            회원가입
          </h1>
          <p className="text-base text-neutral-500 dark:text-neutral-400">
            Riff와 함께 음악 여정을 시작하세요
          </p>
        </div>

        {/* Single Form */}
        <form onSubmit={handleRegister} className="space-y-6">
          <div className="p-6 rounded-2xl border border-border bg-white dark:bg-neutral-950">
            <div className="space-y-4">
              {/* Email Input with Auto-check */}
              <div>
                <Input
                  label="이메일"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 주소"
                  error={errors.email}
                  fullWidth
                />
                {getValidationIndicator(emailStatus) && (
                  <p className={`text-sm mt-1 ${getValidationIndicator(emailStatus)!.color}`}>
                    {getValidationIndicator(emailStatus)!.text}
                  </p>
                )}
              </div>

              {/* Nickname Input with Auto-check */}
              <div>
                <Input
                  label="닉네임"
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="2-15자 사이의 닉네임"
                  error={errors.nickname}
                  fullWidth
                />
                {getValidationIndicator(nicknameStatus) && (
                  <p className={`text-sm mt-1 ${getValidationIndicator(nicknameStatus)!.color}`}>
                    {getValidationIndicator(nicknameStatus)!.text}
                  </p>
                )}
              </div>

              <div>
                <Input
                  label="비밀번호"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="영문 대소문자, 숫자, 특수문자 포함 8자 이상"
                  error={errors.password}
                  fullWidth
                />
                {password && (
                  <div className="mt-2 space-y-1">
                    {getPasswordRequirements().map((req, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <span className={`text-sm ${req.met ? 'text-green-600 dark:text-green-400' : 'text-neutral-400 dark:text-neutral-600'}`}>
                          {req.met ? '✓' : '○'}
                        </span>
                        <span className={`text-sm ${req.met ? 'text-green-600 dark:text-green-400' : 'text-neutral-500 dark:text-neutral-500'}`}>
                          {req.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <Input
                  label="비밀번호 확인"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="비밀번호를 다시 입력해주세요"
                  error={errors.confirmPassword}
                  fullWidth
                />
                {confirmPassword && !errors.confirmPassword && (
                  <p className="text-sm mt-1 text-green-600 dark:text-green-400">
                    ✓ 비밀번호가 일치합니다
                  </p>
                )}
              </div>

                {/* Terms Agreement */}
                <div className="pt-4 border-t border-border space-y-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-neutral-300 dark:border-neutral-700 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-base text-foreground flex-1">
                      <span className="font-medium text-red-600 dark:text-red-400">(필수)</span> 이용약관에 동의합니다.{' '}
                      <button
                        type="button"
                        onClick={() => setShowTermsModal(true)}
                        className="text-primary-600 dark:text-primary-400 underline hover:no-underline cursor-pointer"
                      >
                        자세히 보기
                      </button>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreePrivacyCollectAccount}
                      onChange={(e) => setAgreePrivacyCollectAccount(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-neutral-300 dark:border-neutral-700 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-base text-foreground flex-1">
                      <span className="font-medium text-red-600 dark:text-red-400">(필수)</span> 개인정보 수집·이용 동의 (계정/가입){' '}
                      <button
                        type="button"
                        onClick={() => setShowPrivacyModal(true)}
                        className="text-primary-600 dark:text-primary-400 underline hover:no-underline cursor-pointer"
                      >
                        자세히 보기
                      </button>
                    </span>
                  </label>

                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeMarketingEmail}
                      onChange={(e) => setAgreeMarketingEmail(e.target.checked)}
                      className="mt-1 w-5 h-5 rounded border-neutral-300 dark:border-neutral-700 text-primary-600 focus:ring-primary-500"
                    />
                    <span className="text-base text-foreground flex-1">
                      <span className="font-medium text-neutral-500">(선택)</span> 광고성 정보 수신 동의 (이메일)
                    </span>
                  </label>
                </div>
              </div>
            </div>

          {errors.general && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-base text-red-600 dark:text-red-400">{errors.general}</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting || !agreeTerms || !agreePrivacyCollectAccount}
            fullWidth
            size="lg"
          >
            {isSubmitting ? '가입 중...' : '회원가입 완료'}
          </Button>
        </form>

        {/* Login Link */}
        <p className="text-center mt-6 text-base text-neutral-500">
          이미 계정이 있으신가요?{' '}
          <a href="/auth/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline cursor-pointer">
            로그인
          </a>
        </p>
      </div>

      {/* Terms of Service Modal */}
      {showTermsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowTermsModal(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl font-bold text-foreground">이용약관</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <TermsOfServiceContent />
            </div>
            <div className="p-6 border-t border-border flex justify-end">
              <button
                onClick={() => setShowTermsModal(false)}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Collection Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowPrivacyModal(false)}>
          <div className="bg-white dark:bg-neutral-900 rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-border">
              <h2 className="text-2xl font-bold text-foreground">개인정보 수집·이용 동의 (계정/가입)</h2>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <PrivacyCollectionContent />
            </div>
            <div className="p-6 border-t border-border flex justify-end">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-semibold cursor-pointer"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
