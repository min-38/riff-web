'use client';

import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/useAuth';
import { getRelativeTime } from '@/lib/utils/time';
import { tradeGearApi } from '@/lib/api/tradeGear';
import {
  GearStatus,
  Region,
  type GearResponse,
  type GetGearsRequest,
} from '@/lib/api/types';
import {
  TOP_CATEGORY_LABELS,
  MID_CATEGORY_LABELS,
  DETAIL_CATEGORY_LABELS,
  TOP_CATEGORY_MID_MAPPING,
  MID_DETAIL_MAPPING,
  STATUS_LABELS,
  STATUS_COLORS,
  REGIONS,
  TOP_CATEGORY_ORDER,
  MID_CATEGORY_ORDER,
  DETAIL_CATEGORY_ORDER,
  GEAR_STATUS_ORDER,
  REGION_ORDER,
  REGION_LABELS,
  type TopCategoryKey,
  type MidCategoryKey,
  type DetailCategoryKey,
} from '@/lib/trade/gear-constants';
import { resolveEnumValue, resolveGearImageUrl } from '@/lib/trade/gear-utils';

type SortOption = 'latest' | 'price_low' | 'price_high' | 'view_high';
type ViewMode = 'grid' | 'list';
type SearchScope = 'all' | 'title' | 'content' | 'title_content' | 'author';
type TopCategoryFilter = TopCategoryKey | 'all';
type MidCategoryFilter = MidCategoryKey | 'all';
type DetailCategoryFilter = DetailCategoryKey | 'all';

export default function InstrumentsPage() {
  const { isLoggedIn, isLoading } = useAuth();
  const [searchInput, setSearchInput] = useState(''); // 사용자 입력값
  const [searchQuery, setSearchQuery] = useState(''); // 실제 검색에 사용되는 값
  const [searchScope, setSearchScope] = useState<SearchScope>('title_content'); // 검색 범위
  const [selectedTopCategory, setSelectedTopCategory] = useState<TopCategoryFilter>('all');
  const [selectedCategory, setSelectedCategory] = useState<MidCategoryFilter>('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState<DetailCategoryFilter>('all');
  const [selectedStatus, setSelectedStatus] = useState<GearStatus | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<Region | 'all'>('all');
  const [minPrice, setMinPrice] = useState('0');
  const [maxPrice, setMaxPrice] = useState('0');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [mounted, setMounted] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [gears, setGears] = useState<GearResponse[]>([]);
  const [isLoadingGears, setIsLoadingGears] = useState(true);
  const [gearError, setGearError] = useState<string | null>(null);
  const [totalPages, setTotalPages] = useState(1);

  const itemsPerPage = 24; // 고정값

  // 검색 디바운싱 (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // 클라이언트 마운트 후 localStorage 값 불러오기
  useEffect(() => {
    setMounted(true);

    const savedViewMode = localStorage.getItem('instrumentViewMode') as ViewMode;

    if (savedViewMode) {
      setViewMode(savedViewMode);
    }
  }, []);

  // viewMode 변경 시 localStorage에 저장
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (typeof window !== 'undefined') {
      localStorage.setItem('instrumentViewMode', mode);
    }
  };

  // 새로고침 함수
  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshKey((prev) => prev + 1);
  };

  // 카테고리 변경 핸들러 (서브카테고리 리셋)
  const handleCategoryChange = (category: MidCategoryFilter) => {
    setSelectedCategory(category);
    setSelectedSubCategory('all'); // 카테고리 변경 시 서브카테고리 리셋
  };

  const handleTopCategoryChange = (category: TopCategoryFilter) => {
    setSelectedTopCategory(category);
    if (category === 'all') {
      setSelectedCategory('all');
      setSelectedSubCategory('all');
      return;
    }

    if (category === 'etc') {
      setSelectedCategory('all');
      setSelectedSubCategory('all');
      return;
    }

    if (
      selectedCategory !== 'all' &&
      !TOP_CATEGORY_MID_MAPPING[category].includes(selectedCategory)
    ) {
      setSelectedCategory('all');
      setSelectedSubCategory('all');
    }
  };

  // 숫자 포맷팅 함수 (천 단위 구분자)
  const formatNumber = (value: string) => {
    if (!value) return '';
    const number = value.replace(/,/g, '');
    return parseInt(number).toLocaleString();
  };

  // 가격 입력 핸들러
  const handlePriceChange = (value: string, setter: (value: string) => void) => {
    const numericValue = value.replace(/[^0-9]/g, '');
    // 빈 문자열이면 0으로 설정
    setter(numericValue === '' ? '0' : numericValue);
  };

  // 키 입력 핸들러 (backspace 처리)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, value: string, setter: (value: string) => void) => {
    if (e.key === 'Backspace') {
      const numericValue = value.replace(/[^0-9]/g, '');
      // 한 자리 숫자일 때 backspace 누르면 0으로
      if (numericValue.length === 1) {
        e.preventDefault();
        setter('0');
      }
    }
  };

  useEffect(() => {
    const fetchGears = async () => {
      setIsLoadingGears(true);
      setGearError(null);

      const sortMap: Record<SortOption, { sortBy: GetGearsRequest['sortBy']; sortOrder: GetGearsRequest['sortOrder'] }> = {
        latest: { sortBy: 'created_at', sortOrder: 'desc' },
        price_low: { sortBy: 'price', sortOrder: 'asc' },
        price_high: { sortBy: 'price', sortOrder: 'desc' },
        view_high: { sortBy: 'view_count', sortOrder: 'desc' },
      };

      const { sortBy: apiSortBy, sortOrder: apiSortOrder } = sortMap[sortBy];
      const params: GetGearsRequest = {
        page: currentPage,
        pageSize: itemsPerPage,
        sortBy: apiSortBy,
        sortOrder: apiSortOrder,
      };

      if (selectedTopCategory !== 'all') {
        params.category = selectedTopCategory as unknown as GetGearsRequest['category'];
      }
      if (selectedCategory !== 'all') {
        params.subCategory = selectedCategory as unknown as GetGearsRequest['subCategory'];
      }
      if (selectedSubCategory !== 'all') {
        params.detailCategory = selectedSubCategory as unknown as GetGearsRequest['detailCategory'];
      }
      if (selectedStatus !== 'all') {
        params.status = selectedStatus as GearStatus;
      }
      if (selectedRegion !== 'all') {
        params.region = selectedRegion as Region;
      }
      if (minPrice !== '0') {
        params.minPrice = parseInt(minPrice) || 0;
      }
      if (maxPrice !== '0') {
        params.maxPrice = parseInt(maxPrice) || 0;
      }
      if (searchQuery.trim()) {
        params.searchKeyword = searchQuery.trim();
      }
      if (searchScope !== 'all') {
        params.searchScope = searchScope;
      }

      try {
        const response = await tradeGearApi.getGears(params);
        setGears(response.gears);
        setTotalPages(response.totalPages);
      } catch (error) {
        setGearError(
          (error as Error).message || '게시글을 불러오지 못했습니다.'
        );
      } finally {
        setIsLoadingGears(false);
        setIsRefreshing(false);
      }
    };

    fetchGears();
  }, [
    currentPage,
    itemsPerPage,
    selectedCategory,
    selectedSubCategory,
    selectedStatus,
    selectedRegion,
    minPrice,
    maxPrice,
    searchQuery,
    searchScope,
    sortBy,
    refreshKey,
  ]);

  // 필터 변경 시 1페이지로 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, searchScope, selectedCategory, selectedSubCategory, selectedStatus, selectedRegion, minPrice, maxPrice, sortBy]);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 페이지 헤더 */}
        <div className="mb-1">
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-foreground mb-3">악기 거래</h1>
            <p className="text-lg text-neutral-600 dark:text-neutral-400">
              다양한 악기를 거래해보세요
            </p>
          </div>
        </div>

        {mounted ? (
          <>
            {/* 글쓰기 버튼 - 로그인 시에만 표시 */}
            <div className="mb-4 flex justify-end min-h-[48px]">
              {!isLoading && isLoggedIn && (
                <a
                  href="/trade/gears/new"
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-primary-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200 cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="hidden sm:inline">글쓰기</span>
                </a>
              )}
            </div>

            <div className="mb-6 flex gap-3">
              <select
                value={searchScope}
                onChange={(e) => setSearchScope(e.target.value as SearchScope)}
                className="px-4 py-4 rounded-2xl bg-white dark:bg-neutral-900 text-foreground shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer appearance-none min-w-[140px]"
              >
                <option value="title_content">제목+내용</option>
                <option value="title">제목</option>
                <option value="content">내용</option>
                <option value="author">닉네임</option>
                <option value="all">전체</option>
              </select>
              <div className="relative flex-1">
                <svg
                  className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-neutral-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="악기, 브랜드, 모델명 검색..."
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white dark:bg-neutral-900 text-foreground placeholder:text-neutral-400 shadow-sm hover:shadow-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all"
                />
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
              <aside className="space-y-4">
                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm">
                  <div className="mb-4 text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                    필터
                  </div>

                  <div className="space-y-4 divide-y divide-neutral-200 dark:divide-neutral-800">
                    <div className="space-y-2 pt-4 first:pt-0">
                      <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">대분류</label>
                      <select
                        value={selectedTopCategory}
                        onChange={(e) => handleTopCategoryChange(e.target.value as TopCategoryFilter)}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer appearance-none"
                      >
                        <option value="all">전체</option>
                        {Object.entries(TOP_CATEGORY_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2 pt-4 first:pt-0">
                      <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">중분류</label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => handleCategoryChange(e.target.value as MidCategoryFilter)}
                        disabled={selectedTopCategory === 'all' || selectedTopCategory === 'etc'}
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="all">전체</option>
                        {Object.entries(MID_CATEGORY_LABELS)
                          .filter(([value]) =>
                            selectedTopCategory === 'all'
                              ? true
                              : TOP_CATEGORY_MID_MAPPING[selectedTopCategory].includes(
                                  value as MidCategoryKey
                                )
                          )
                          .map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="space-y-2 pt-4 first:pt-0">
                      <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">소분류</label>
                      <select
                        value={selectedSubCategory}
                        onChange={(e) => setSelectedSubCategory(e.target.value as DetailCategoryFilter)}
                        disabled={
                          selectedTopCategory === 'etc' ||
                          selectedCategory === 'all' ||
                          selectedCategory === 'other'
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer appearance-none disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <option value="all">전체</option>
                        {selectedCategory !== 'all' &&
                          MID_DETAIL_MAPPING[selectedCategory].map((subCat) => (
                            <option key={subCat} value={subCat}>
                              {DETAIL_CATEGORY_LABELS[subCat]}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5 shadow-sm space-y-4 divide-y divide-neutral-200 dark:divide-neutral-800">
                  <div className="space-y-2 pt-4 first:pt-0">
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">상태</label>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value as GearStatus | 'all')}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer appearance-none"
                    >
                      <option value="all">전체</option>
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 pt-4 first:pt-0">
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">지역</label>
                    <select
                      value={selectedRegion}
                      onChange={(e) => setSelectedRegion(e.target.value as Region | 'all')}
                      className="w-full px-4 py-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950 text-foreground shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer appearance-none"
                    >
                      <option value="all">전체</option>
                      {REGIONS.map((region) => (
                        <option key={region} value={region}>
                          {REGION_LABELS[region]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 pt-4 first:pt-0">
                    <label className="text-xs font-medium text-neutral-500 dark:text-neutral-400">금액</label>
                    <div className="flex items-center gap-2 rounded-xl bg-neutral-50 dark:bg-neutral-950 px-3 py-2.5 shadow-sm">
                      <input
                        type="text"
                        value={formatNumber(minPrice)}
                        onChange={(e) => handlePriceChange(e.target.value, setMinPrice)}
                        onKeyDown={(e) => handleKeyDown(e, minPrice, setMinPrice)}
                        placeholder="최소"
                        className="bg-transparent text-foreground text-right focus:outline-none w-full"
                      />
                      <span className="text-neutral-400">~</span>
                      <input
                        type="text"
                        value={formatNumber(maxPrice)}
                        onChange={(e) => handlePriceChange(e.target.value, setMaxPrice)}
                        onKeyDown={(e) => handleKeyDown(e, maxPrice, setMaxPrice)}
                        placeholder="최대"
                        className="bg-transparent text-foreground text-right focus:outline-none w-full"
                      />
                      <span className="text-sm text-neutral-500">원</span>
                    </div>
                  </div>
                </div>
              </aside>

              <div>
                <div className="mb-4 flex flex-wrap items-center justify-end gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 p-1 rounded-xl bg-white dark:bg-neutral-900 shadow-sm">
                      <button
                        onClick={() => handleViewModeChange('grid')}
                        className={`p-2 rounded-lg transition-all ${
                          viewMode === 'grid'
                            ? 'bg-primary-500 text-white'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        } cursor-pointer`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleViewModeChange('list')}
                        className={`p-2 rounded-lg transition-all ${
                          viewMode === 'list'
                            ? 'bg-primary-500 text-white'
                            : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                        } cursor-pointer`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                    </div>

                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="px-5 py-3 rounded-xl bg-white dark:bg-neutral-900 text-foreground shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-all cursor-pointer appearance-none"
                    >
                      <option value="latest">최신순</option>
                      <option value="price_low">낮은 가격순</option>
                      <option value="price_high">높은 가격순</option>
                      <option value="view_high">조회 많은 순</option>
                    </select>

                    <button
                      onClick={handleRefresh}
                      disabled={isRefreshing}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-400 hover:text-primary-600 dark:hover:text-primary-400 shadow-sm hover:shadow-md transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <svg
                        className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      <span className="text-sm font-medium">새로고침</span>
                    </button>
                  </div>
                </div>

                {isLoadingGears ? (
                  <div className="text-center py-20">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-neutral-600 dark:text-neutral-400">로딩 중...</p>
                  </div>
                ) : gearError ? (
                  <div className="text-center py-20">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p className="text-neutral-600 dark:text-neutral-400">{gearError}</p>
                  </div>
                ) : gears.length > 0 ? (
                  <>
                    {viewMode === 'grid' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {gears.map((gear) => (
                          <InstrumentCard key={gear.id} instrument={gear} />
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {gears.map((gear) => (
                          <InstrumentListItem key={gear.id} instrument={gear} />
                        ))}
                      </div>
                    )}

                    <div className="mt-12 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                        className="px-4 py-2 rounded-lg bg-primary-600 text-white shadow-sm hover:bg-primary-500 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        이전
                      </button>
                      <span className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400">
                        {currentPage} / {totalPages}
                      </span>
                      {totalPages > 1 &&
                        Array.from(
                          {
                            length: Math.max(
                              0,
                              Math.min(totalPages, currentPage + 2) -
                                Math.max(1, currentPage - 2) +
                                1
                            ),
                          },
                          (_, index) => Math.max(1, currentPage - 2) + index
                        ).map((page) => (
                          <button
                            key={`page-${page}`}
                            onClick={() => setCurrentPage(page)}
                            className={`h-9 w-9 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                              page === currentPage
                                ? 'bg-primary-600 text-white shadow-sm'
                                : 'bg-white dark:bg-neutral-900 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      <button
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 rounded-lg bg-primary-600 text-white shadow-sm hover:bg-primary-500 hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        다음
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20">
                    <div className="text-7xl mb-6">🎸</div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">검색 결과가 없습니다</h3>
                    <p className="text-neutral-600 dark:text-neutral-400 text-lg">
                      다른 검색어나 필터를 시도해보세요
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-neutral-600 dark:text-neutral-400">로딩 중...</p>
          </div>
        )}
      </div>
    </div>
  );
}

const resolveCategoryParts = (gear: GearResponse) => {
  const topKey = resolveEnumValue(
    gear.category as unknown as number | TopCategoryKey,
    TOP_CATEGORY_ORDER,
    TOP_CATEGORY_LABELS
  );

  if (topKey) {
    const midKey = resolveEnumValue(
      gear.subCategory as unknown as number | MidCategoryKey,
      MID_CATEGORY_ORDER,
      MID_CATEGORY_LABELS
    );
    const detailKey = gear.detailCategory
      ? resolveEnumValue(
          gear.detailCategory as unknown as number | DetailCategoryKey,
          DETAIL_CATEGORY_ORDER,
          DETAIL_CATEGORY_LABELS
        )
      : undefined;

    return { topKey, midKey, detailKey };
  }

  const midKey = resolveEnumValue(
    gear.category as unknown as number | MidCategoryKey,
    MID_CATEGORY_ORDER,
    MID_CATEGORY_LABELS
  );
  const detailKey = resolveEnumValue(
    gear.subCategory as unknown as number | DetailCategoryKey,
    DETAIL_CATEGORY_ORDER,
    DETAIL_CATEGORY_LABELS
  );
  const derivedTopKey = midKey
    ? TOP_CATEGORY_ORDER.find((topCategory) =>
        TOP_CATEGORY_MID_MAPPING[topCategory].includes(midKey)
      )
    : undefined;

  return { topKey: derivedTopKey, midKey, detailKey };
};

// 악기 카드 컴포넌트
function InstrumentCard({ instrument }: { instrument: GearResponse }) {
  const imageUrl = resolveGearImageUrl(instrument.images);
  const hasRegion = instrument.region !== null && instrument.region !== undefined;
  const { topKey, midKey, detailKey } = resolveCategoryParts(instrument);
  const topCategoryValue = topKey ? TOP_CATEGORY_LABELS[topKey] : undefined;
  const statusValue = resolveEnumValue(
    instrument.status as unknown as number | GearStatus,
    GEAR_STATUS_ORDER
  );
  const regionValue = instrument.region
    ? resolveEnumValue(
        instrument.region as unknown as number | Region,
        REGION_ORDER,
        REGION_LABELS
      )
    : undefined;
  return (
    <a
      href={`/trade/gears/${instrument.id}`}
      className="group block rounded-3xl bg-white dark:bg-neutral-900 overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 cursor-pointer ring-1 ring-transparent hover:ring-primary-500/60"
    >
      {/* 이미지 */}
      <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
        <CardImage src={imageUrl} alt={instrument.title} />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
        {/* 지역 배지 */}
        {hasRegion && (
          <div className="absolute top-4 left-4 z-10">
            <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-600/90 text-white backdrop-blur-sm shadow-lg">
              {regionValue ? REGION_LABELS[regionValue] : '-'}
            </span>
          </div>
        )}
        {/* 상태 배지 */}
        <div className="absolute top-4 right-4 z-10">
          <span
            className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
              statusValue ? STATUS_COLORS[statusValue] : STATUS_COLORS[GearStatus.Selling]
            }`}
          >
            {statusValue ? STATUS_LABELS[statusValue] : STATUS_LABELS[GearStatus.Selling]}
          </span>
        </div>
        {/* 가격 */}
        <div className="absolute bottom-3 right-4 z-10">
          <div className="inline-flex items-baseline gap-1 rounded-full bg-black/55 px-3 py-1.5 text-white shadow-lg ring-1 ring-white/15">
            <span className="text-xl font-extrabold tracking-tight">
              {instrument.price.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-white/80">원</span>
          </div>
        </div>
      </div>

      {/* 정보 */}
      <div className="p-4 space-y-2">
        {/* 카테고리 */}
        <div className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
          {topCategoryValue ?? '대분류'}
          {topCategoryValue && topCategoryValue !== TOP_CATEGORY_LABELS.etc && (
            <>
              {' '}
              &gt; {midKey ? MID_CATEGORY_LABELS[midKey] : '중분류'} &gt;{' '}
              {detailKey ? DETAIL_CATEGORY_LABELS[detailKey] : '소분류'}
            </>
          )}
        </div>

        {/* 제목 */}
        <h3
          title={instrument.title}
          className="text-base font-bold text-foreground line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors leading-snug"
        >
          {instrument.title}
        </h3>

        <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
          <span>{instrument.authorNickname}</span>
          <span>{getRelativeTime(instrument.createdAt)}</span>
        </div>
      </div>
    </a>
  );
}

function CardImage({ src, alt }: { src?: string; alt: string }) {
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  if (!src || hasError) {
    return (
      <div className="absolute inset-0 z-0 flex items-center justify-center text-sm text-neutral-400">
        이미지 없음
      </div>
    );
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 scale-110 opacity-60 blur-2xl"
        style={{
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 z-0 bg-gradient-to-b from-black/10 via-transparent to-black/20"
      />
      {!isLoaded && (
        <div className="absolute inset-0 z-0 animate-pulse bg-neutral-200 dark:bg-neutral-700" />
      )}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => setHasError(true)}
        className={`absolute inset-0 z-0 w-full h-full object-contain object-center transition-transform duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </>
  );
}

// 악기 리스트 아이템 컴포넌트
function InstrumentListItem({ instrument }: { instrument: GearResponse }) {
  const imageUrl = resolveGearImageUrl(instrument.images);
  const { topKey, midKey, detailKey } = resolveCategoryParts(instrument);
  const topCategoryValue = topKey ? TOP_CATEGORY_LABELS[topKey] : undefined;
  const statusValue = resolveEnumValue(
    instrument.status as unknown as number | GearStatus,
    GEAR_STATUS_ORDER
  );
  const regionValue = instrument.region
    ? resolveEnumValue(
        instrument.region as unknown as number | Region,
        REGION_ORDER,
        REGION_LABELS
      )
    : undefined;
  return (
    <a
      href={`/trade/gears/${instrument.id}`}
      className="group block rounded-2xl bg-white dark:bg-neutral-900 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer"
    >
      <div className="grid grid-cols-[140px_1fr] sm:grid-cols-[180px_1fr]">
        <div className="relative h-full min-h-[120px] overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <CardImage src={imageUrl} alt={instrument.title} />
        </div>

        <div className="min-w-0 space-y-3 p-5">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`px-3 py-1 rounded-full font-bold ${
                statusValue ? STATUS_COLORS[statusValue] : STATUS_COLORS[GearStatus.Selling]
              }`}
            >
              {statusValue ? STATUS_LABELS[statusValue] : STATUS_LABELS[GearStatus.Selling]}
            </span>
            <span className="text-primary-600 dark:text-primary-400 font-semibold uppercase tracking-wider">
              {topCategoryValue ?? '대분류'}
              {topCategoryValue && topCategoryValue !== TOP_CATEGORY_LABELS.etc && (
                <>
                  {' '}
                  &gt; {midKey ? MID_CATEGORY_LABELS[midKey] : '중분류'} &gt;{' '}
                  {detailKey ? DETAIL_CATEGORY_LABELS[detailKey] : '소분류'}
                </>
              )}
            </span>
          </div>

          <div className="min-w-0">
            <h3
              title={instrument.title}
              className="text-lg font-bold text-foreground truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors"
            >
              {instrument.title}
            </h3>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400 line-clamp-1">
              {(instrument.description || '').split(/[\n.!?。！？]/)[0]}
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex items-baseline gap-1 rounded-full bg-neutral-100 px-3 py-1 text-neutral-900 dark:bg-neutral-800 dark:text-neutral-100">
              <span className="text-2xl font-extrabold tracking-tight">
                {instrument.price.toLocaleString()}
              </span>
              <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                원
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-600 dark:text-neutral-300">
              <span className="font-semibold text-primary-700 dark:text-primary-300">
                {instrument.authorNickname}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-3 py-1 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100">
                📍 {regionValue ? REGION_LABELS[regionValue] : '-'}
              </span>
              <span>{getRelativeTime(instrument.createdAt)}</span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  />
                </svg>
                {instrument.viewCount}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                {instrument.chatCount}
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                {instrument.likeCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </a>
  );
}
