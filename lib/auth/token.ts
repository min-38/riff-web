/**
 * 토큰 저장 및 관리 유틸리티
 */

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * 액세스 토큰 저장
 */
export const setAccessToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  }
};

/**
 * 리프레시 토큰 저장
 */
export const setRefreshToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  }
};

/**
 * 액세스 토큰 가져오기
 */
export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
};

/**
 * 리프레시 토큰 가져오기
 */
export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
};

/**
 * 토큰 저장 (액세스 + 리프레시)
 */
export const setTokens = (accessToken: string, refreshToken: string) => {
  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

/**
 * 모든 토큰 삭제
 */
export const clearTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

/**
 * 로그인 여부 확인
 */
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};
