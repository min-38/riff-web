/**
 * 이전 페이지 추적 및 리다이렉션 유틸리티
 **/

const REDIRECT_KEY = 'redirect_after_auth';

// 로그인/회원가입 관련 페이지들 (리다이렉션 대상에서 제외)
const EXCLUDED_PATHS = [
  '/login',
  '/signup',
  '/verify-email',
  '/verify-email-sent',
  '/auth/verify-success',
  '/auth/verify-error',
];

/**
 * 현재 페이지를 이전 페이지로 저장
 */
export const saveRedirectPath = (path: string) => {
  // 제외된 경로는 저장하지 않음
  if (EXCLUDED_PATHS.some((excluded) => path.startsWith(excluded)))
    return;

  if (typeof window !== 'undefined')
    sessionStorage.setItem(REDIRECT_KEY, path);
};

/**
 * 저장된 이전 페이지 경로 가져오기
 */
export const getRedirectPath = (): string | null => {
  if (typeof window !== 'undefined')
    return sessionStorage.getItem(REDIRECT_KEY);
  return null;
};

/**
 * 저장된 이전 페이지 경로 삭제
 */
export const clearRedirectPath = () => {
  if (typeof window !== 'undefined')
    sessionStorage.removeItem(REDIRECT_KEY);
};

/**
 * 인증 후 리다이렉션할 경로 가져오기
 * 저장된 경로가 있으면 해당 경로로, 없으면 메인 페이지로
 */
export const getRedirectAfterAuth = (): string => {
  const savedPath = getRedirectPath();
  clearRedirectPath();
  return savedPath || '/';
};
