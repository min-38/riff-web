'use client';

import Header from '@/components/Header';
import Image from 'next/image';

type FeaturedPost = {
  id: number;
  title: string;
  price: number;
  images: string[];
  location: string;
  viewCount: number;
};

const categories = [
  {
    id: 'guitar',
    name: '기타',
    icon: '🎸',
    gradient: 'from-primary-500 to-primary-700',
    description: '일렉/어쿠스틱 기타',
  },
  {
    id: 'bass',
    name: '베이스',
    icon: '🎸',
    gradient: 'from-primary-600 to-primary-800',
    description: '베이스 기타',
  },
  {
    id: 'drum',
    name: '드럼',
    icon: '🥁',
    gradient: 'from-primary-500 to-primary-600',
    description: '어쿠스틱/전자 드럼',
  },
  {
    id: 'keyboard',
    name: '건반',
    icon: '🎹',
    gradient: 'from-primary-400 to-primary-600',
    description: '피아노/신디사이저',
  },
];

export default function Home() {
  const featuredPosts: FeaturedPost[] = [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-60 dark:opacity-40"
          style={{ background: 'var(--gradient-hero)' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center space-y-4 animate-[fadeIn_0.8s_ease-out]">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              <span className="bg-gradient-to-r from-primary-600 via-primary-500 to-primary-600 bg-clip-text text-transparent">
                음악의 시작
              </span>
            </h1>
            <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-xl mx-auto">
              당신의 음악 여정을 함께할 악기를 찾아보세요
            </p>
            <div className="flex gap-3 justify-center pt-2">
              <button className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-semibold rounded-full hover:shadow-lg hover:shadow-primary-500/30 hover:scale-105 transition-all duration-300 cursor-pointer">
                둘러보기
              </button>
              <button className="px-6 py-2.5 glass rounded-full text-sm font-semibold text-foreground hover:scale-105 transition-all duration-300 cursor-pointer">
                판매하기
              </button>
            </div>
          </div>
        </div>

        {/* Decorative gradient orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-400/20 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-primary-600/20 rounded-full blur-3xl -z-10" />
      </section>

      {/* Featured Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
              주목할 만한 상품
            </h2>
            <p className="text-neutral-500 dark:text-neutral-400">
              최근 등록된 프리미엄 악기들
            </p>
          </div>
        </div>

        {featuredPosts.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {featuredPosts.map((post, index) => (
              <div
                key={post.id}
                className="group relative overflow-hidden rounded-3xl cursor-pointer animate-[scaleIn_0.6s_ease-out]"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {/* Large image */}
                <div
                  className="relative overflow-hidden bg-neutral-100 dark:bg-neutral-900"
                  style={{
                    aspectRatio: '3 / 4',
                    minHeight: '400px',
                    containIntrinsicSize: '100% 400px',
                    contentVisibility: 'auto'
                  }}
                >
                  <Image
                    src={post.images[0]}
                    alt={post.title}
                    fill
                    priority={index === 0}
                    placeholder="blur"
                    blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWEREiMxUf/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=="
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                    style={{ width: '100%', height: '100%' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 text-white">
                    <div className="space-y-3">
                      <span className="inline-block px-3 py-1.5 bg-primary-500/90 backdrop-blur-sm rounded-full text-sm font-medium">
                        Featured
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-bold leading-tight">
                        {post.title}
                      </h3>
                      <p className="text-3xl sm:text-4xl font-bold">
                        {post.price.toLocaleString('ko-KR')}
                        <span className="text-lg font-normal ml-1">원</span>
                      </p>
                      <div className="flex items-center gap-4 text-sm text-white/80">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {post.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {post.viewCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-neutral-200 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/40 p-10 text-center text-neutral-500 dark:text-neutral-400">
            아직 주목할 만한 상품이 없습니다.
          </div>
        )}
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="mb-8">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            카테고리별 탐색
          </h2>
          <p className="text-neutral-500 dark:text-neutral-400">
            원하는 악기를 빠르게 찾아보세요
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {categories.map((category, index) => (
            <button
              key={category.id}
              className="group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-primary-500/20 animate-[scaleIn_0.6s_ease-out] cursor-pointer"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-90 group-hover:opacity-100 transition-opacity`} />
              <div className="relative z-10 space-y-3 text-white">
                <div className="text-5xl">{category.icon}</div>
                <div>
                  <h3 className="text-2xl font-bold mb-1">{category.name}</h3>
                  <p className="text-sm text-white/90">{category.description}</p>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium pt-2">
                  <span>둘러보기</span>
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-40"
          style={{ background: 'var(--gradient-primary)' }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            악기를 판매하고 싶으신가요?
          </h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            몇 분만에 등록하고 전국의 음악가들과 거래하세요
          </p>
          <a href="/auth/signup" className="cursor-pointer">
            <button className="px-8 py-3.5 bg-white text-primary-600 font-semibold rounded-full hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer">
              지금 시작하기
            </button>
          </a>
        </div>
      </section>
    </div>
  );
}
