'use client';

import { usePathname } from 'next/navigation';
import { Button } from './ui';
import ThemeToggle from './ThemeToggle';
import ProfileMenu from './ProfileMenu';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const { isLoggedIn, isLoading, user, logout } = useAuth();
  const pathname = usePathname();

  return (
    <header className="border-b border-border/50 glass sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-700 rounded-xl flex items-center justify-center group-hover:shadow-lg group-hover:shadow-primary-500/50 group-hover:scale-110 transition-all duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent">Riff</span>
          </a>

          {/* Navigation - Hidden on mobile */}
          <nav className="hidden lg:flex items-center gap-1 ml-8">
            <a
              href="/trade/gears"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                pathname?.startsWith('/trade/gears')
                  ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                  : 'text-neutral-700 dark:text-neutral-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
            >
              악기거래
            </a>
          </nav>

          <div className="flex-1" />

          {/* Right section */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {!isLoading && (
              <>
                {isLoggedIn ? (
                  // 로그인 상태: 프로필 메뉴
                  <>
                    <div className="h-6 w-px bg-border/50 hidden sm:block" />
                    <ProfileMenu user={user} onLogout={logout} />
                  </>
                ) : (
                  // 비로그인 상태: 로그인/회원가입 버튼
                  <>
                    <div className="h-6 w-px bg-border/50 hidden sm:block" />
                    <div className="hidden sm:flex items-center gap-2">
                      <a href="/auth/login" className="cursor-pointer">
                        <Button variant="ghost" size="sm">
                          로그인
                        </Button>
                      </a>
                      <a href="/auth/signup" className="cursor-pointer">
                        <button className="px-5 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold rounded-full hover:shadow-lg hover:shadow-primary-500/30 hover:scale-105 transition-all duration-200 cursor-pointer">
                          회원가입
                        </button>
                      </a>
                    </div>
                    {/* Mobile auth */}
                    <div className="sm:hidden">
                      <a href="/auth/login" className="cursor-pointer">
                        <button className="px-4 py-1.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-xs font-semibold rounded-full hover:scale-105 transition-transform cursor-pointer">
                          로그인
                        </button>
                      </a>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
