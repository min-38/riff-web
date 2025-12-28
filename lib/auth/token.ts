// 토큰 저장 및 관리 유틸리티
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const REMEMBER_ME_KEY = 'remember_me';

// localStorage 또는 sessionStorage 가져오기
const getStorage = (): Storage => {
  if (typeof window === 'undefined') {
    throw new Error('Window is not defined');
  }

  // 로그인 유지 설정 확인
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  return rememberMe ? localStorage : sessionStorage;
};

// 로그인 유지 설정 저장
export const setRememberMe = (remember: boolean) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(REMEMBER_ME_KEY, remember.toString());
  }
};

// 로그인 유지 설정 가져오기
export const getRememberMe = (): boolean => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  }
  return false;
};

// 액세스 토큰 저장
export const setAccessToken = (token: string) => {
  if (typeof window !== 'undefined') {
    const storage = getStorage();
    storage.setItem(ACCESS_TOKEN_KEY, token);
  }
};

// 리프레시 토큰 저장
export const setRefreshToken = (token: string) => {
  if (typeof window !== 'undefined') {
    const storage = getStorage();
    storage.setItem(REFRESH_TOKEN_KEY, token);
  }
};


// 액세스 토큰 가져오기
export const getAccessToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // localStorage와 sessionStorage 모두 확인
    return localStorage.getItem(ACCESS_TOKEN_KEY) ||
           sessionStorage.getItem(ACCESS_TOKEN_KEY);
  }
  return null;
};


// 리프레시 토큰 가져오기
export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    // localStorage와 sessionStorage 모두 확인
    return localStorage.getItem(REFRESH_TOKEN_KEY) ||
           sessionStorage.getItem(REFRESH_TOKEN_KEY);
  }
  return null;
};

// 토큰 저장 (액세스 + 리프레시)
export const setTokens = (accessToken: string, refreshToken: string, rememberMe?: boolean) => {
  // rememberMe가 명시적으로 전달된 경우 설정
  if (rememberMe !== undefined) {
    setRememberMe(rememberMe);
  }

  setAccessToken(accessToken);
  setRefreshToken(refreshToken);
};

// 모든 토큰 삭제
export const clearTokens = () => {
  if (typeof window !== 'undefined') {
    // 양쪽 스토리지에서 모두 삭제
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

// 로그인 여부 확인
export const isAuthenticated = (): boolean => {
  return !!getAccessToken();
};

// Base64 URL-safe 디코딩 함수
const base64UrlDecode = (str: string): string => {
  // Base64 URL-safe를 일반 Base64로 변환
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');

  // Padding 추가
  const pad = base64.length % 4;
  if (pad) {
    base64 += '='.repeat(4 - pad);
  }

  // Base64 디코딩 후 UTF-8로 변환
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  // UTF-8 디코더 사용
  return new TextDecoder('utf-8').decode(bytes);
};

// JWT 토큰에서 사용자 정보 추출
export const getUserFromToken = (): { userId: string; email: string; nickname: string } | null => {
  const token = getAccessToken();
  if (!token) return null;

  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(base64UrlDecode(payload));

    return {
      userId: decoded.sub || decoded.userId,
      email: decoded.email,
      nickname: decoded.nickname,
    };
  } catch (error) {
    console.error('Failed to decode token:', error);
    return null;
  }
};
