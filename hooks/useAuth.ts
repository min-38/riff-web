import { useState, useEffect } from 'react';
import { isAuthenticated, clearTokens, getUserFromToken } from '@/lib/auth/token';

interface User {
  userId: string;
  email: string;
  nickname: string;
}

/**
 * 인증 상태를 관리하는 훅
 */
export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    const authenticated = isAuthenticated();
    setIsLoggedIn(authenticated);

    if (authenticated) {
      const userData = getUserFromToken();
      setUser(userData);
    }

    setIsLoading(false);
  }, []);

  const logout = () => {
    clearTokens();
    setIsLoggedIn(false);
    setUser(null);
    // 로그아웃 후 메인 페이지로 이동
    window.location.href = '/';
  };

  return { isLoggedIn, isLoading, user, logout };
}
