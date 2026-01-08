'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/Header';
import { tradeGearApi } from '@/lib/api/tradeGear';
import type { ApiError, GearResponse } from '@/lib/api/types';
import { GearStatus } from '@/lib/api/types';
import { getRelativeTime } from '@/lib/utils/time';
import {
  TOP_CATEGORY_LABELS,
  MID_CATEGORY_LABELS,
  DETAIL_CATEGORY_LABELS,
  TOP_CATEGORY_MID_MAPPING,
  TOP_CATEGORY_ORDER,
  MID_CATEGORY_ORDER,
  DETAIL_CATEGORY_ORDER,
  STATUS_LABELS,
  STATUS_COLORS,
  CONDITION_LABELS,
  CONDITION_ORDER,
  TRADE_METHOD_LABELS,
  TRADE_METHOD_ORDER,
  REGION_LABELS,
  GEAR_STATUS_ORDER,
  REGION_ORDER,
  type MidCategoryKey,
  type DetailCategoryKey,
  type TopCategoryKey,
} from '@/lib/trade/gear-constants';
import { appendCacheBust, resolveEnumValue } from '@/lib/trade/gear-utils';
import { PUBLIC_STORAGE_BASE_URL } from '@/lib/config/publicEnv';

const resolveImageUrls = (images?: GearResponse['images']): string[] => {
  const urls = images?.urls ?? [];
  if (urls.length === 0) return [];
  const base = (images?.public_base_url || PUBLIC_STORAGE_BASE_URL || '').replace(/\/$/, '');
  return urls.map((url) => {
    if (/^https?:\/\//i.test(url)) return appendCacheBust(url);
    if (!base) return appendCacheBust(url);
    return appendCacheBust(`${base}/${url.replace(/^\//, '')}`);
  });
};

const renderInlineMarkdown = (text: string) => {
  return text
    .replace(/`(.+?)`/g, '<code>$1</code>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.+?)__/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/~~(.+?)~~/g, '<del>$1</del>');
};

const renderDescriptionHtml = (text?: string): string => {
  if (!text) return '';
  const trimmed = text.trim();
  if (!trimmed) return '';

  const escaped = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\r\n/g, '\n');

  const lines = escaped.split('\n');
  let html = '';
  let inUl = false;
  let inOl = false;
  let inQuote = false;

  const closeLists = () => {
    if (inUl) {
      html += '</ul>';
      inUl = false;
    }
    if (inOl) {
      html += '</ol>';
      inOl = false;
    }
  };

  const closeQuote = () => {
    if (inQuote) {
      html += '</blockquote>';
      inQuote = false;
    }
  };

  lines.forEach((line) => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      closeLists();
      closeQuote();
      html += '<br />';
      return;
    }

    if (trimmedLine.startsWith('> ')) {
      closeLists();
      if (!inQuote) {
        html += '<blockquote>';
        inQuote = true;
      }
      html += `<p>${renderInlineMarkdown(trimmedLine.replace(/^> /, ''))}</p>`;
      return;
    }

    if (/^#{1,6}\s/.test(trimmedLine)) {
      closeLists();
      closeQuote();
      const level = Math.min(6, trimmedLine.match(/^#{1,6}/)?.[0].length ?? 1);
      const content = trimmedLine.replace(/^#{1,6}\s/, '');
      html += `<h${level}>${renderInlineMarkdown(content)}</h${level}>`;
      return;
    }

    if (/^\d+\.\s/.test(trimmedLine)) {
      closeQuote();
      if (!inOl) {
        html += '<ol>';
        inOl = true;
      }
      html += `<li>${renderInlineMarkdown(trimmedLine.replace(/^\d+\.\s/, ''))}</li>`;
      return;
    }

    if (/^[-*]\s/.test(trimmedLine)) {
      closeQuote();
      if (!inUl) {
        html += '<ul>';
        inUl = true;
      }
      html += `<li>${renderInlineMarkdown(trimmedLine.replace(/^[-*]\s/, ''))}</li>`;
      return;
    }

    closeLists();
    closeQuote();
    html += `<p>${renderInlineMarkdown(trimmedLine)}</p>`;
  });

  closeLists();
  closeQuote();

  return html;
};

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

export default function GearDetailPage() {
  const router = useRouter();
  const params = useParams();
  const gearId = Number(params?.id);
  const [gear, setGear] = useState<GearResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isZoomVisible, setIsZoomVisible] = useState(false);
  const zoomTimeoutRef = useRef<number | null>(null);
  const [dragStartX, setDragStartX] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusValue, setStatusValue] = useState<GearStatus | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!Number.isFinite(gearId)) {
      setError('잘못된 게시글입니다.');
      setIsLoading(false);
      return;
    }

    const fetchGear = async () => {
      try {
        const response = await tradeGearApi.getGearById(gearId);
        setGear(response);
        setSelectedIndex(0);
        const resolvedStatus = resolveEnumValue(
          response.status as unknown as number | string,
          GEAR_STATUS_ORDER,
          STATUS_LABELS
        );
        setStatusValue((resolvedStatus as GearStatus) || null);
      } catch (err) {
        setError((err as Error).message || '게시글을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGear();
  }, [gearId]);

  const imageUrls = useMemo(() => resolveImageUrls(gear?.images), [gear]);
  const hasImages = imageUrls.length > 0;
  const safeIndex = hasImages ? Math.min(selectedIndex, imageUrls.length - 1) : 0;
  const selectedImage = hasImages ? imageUrls[safeIndex] : undefined;

  useEffect(() => {
    if (safeIndex !== selectedIndex) {
      setSelectedIndex(safeIndex);
    }
  }, [safeIndex, selectedIndex]);

  const categoryParts = gear ? resolveCategoryParts(gear) : null;
  const topCategoryLabel = categoryParts?.topKey
    ? TOP_CATEGORY_LABELS[categoryParts.topKey]
    : undefined;
  const statusKey = gear
    ? resolveEnumValue(gear.status as unknown as number | string, GEAR_STATUS_ORDER, STATUS_LABELS)
    : undefined;
  const effectiveStatus = statusValue ?? (statusKey as GearStatus) ?? gear?.status;
  const regionKey = gear
    ? resolveEnumValue(gear.region as unknown as number | string, REGION_ORDER, REGION_LABELS)
    : undefined;
  const tradeMethodKey = gear
    ? resolveEnumValue(
        gear.tradeMethod as unknown as number | string,
        TRADE_METHOD_ORDER,
        TRADE_METHOD_LABELS
      )
    : undefined;
  const tradeMethodLabel = tradeMethodKey
    ? TRADE_METHOD_LABELS[tradeMethodKey]
    : gear?.tradeMethod;
  const conditionKey = gear
    ? resolveEnumValue(
        gear.condition as unknown as number | string,
        CONDITION_ORDER,
        CONDITION_LABELS
      )
    : undefined;
  const conditionLabel = conditionKey
    ? CONDITION_LABELS[conditionKey]
    : gear?.condition;
  const descriptionHtml = useMemo(
    () => renderDescriptionHtml(gear?.description),
    [gear?.description]
  );

  const goPrev = () =>
    setSelectedIndex((prev) => Math.max(prev - 1, 0));
  const goNext = () =>
    setSelectedIndex((prev) => Math.min(prev + 1, imageUrls.length - 1));

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!hasImages) return;
    setDragStartX(event.clientX);
    setIsDragging(false);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX === null) return;
    if (Math.abs(event.clientX - dragStartX) > 12) {
      setIsDragging(true);
    }
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartX === null) return;
    const delta = event.clientX - dragStartX;
    setDragStartX(null);
    setIsDragging(false);
    if (Math.abs(delta) > 40) {
      if (delta < 0) {
        goNext();
      } else {
        goPrev();
      }
    }
  };

  const handleDelete = async () => {
    if (!gear) return;
    if (!confirm('게시글을 삭제하시겠습니까?')) return;
    try {
      setIsDeleting(true);
      await tradeGearApi.deleteGear(gear.id);
      router.push('/trade/gears');
    } catch (err) {
      const apiError = err as ApiError;
      const errorCode = apiError?.code as string | undefined;
      const messageByCode: Record<string, string> = {
        INVALID_TOKEN: '로그인이 필요합니다.',
        FORBIDDEN: '본인 글만 삭제할 수 있습니다.',
        NOT_FOUND: '게시글이 존재하지 않거나 이미 삭제되었습니다.',
        INTERNAL_SERVER_ERROR: '서버 오류로 삭제에 실패했습니다.',
      };
      alert(messageByCode[errorCode] ?? apiError?.message ?? '게시글 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleStatusChange = async (nextStatus: GearStatus) => {
    if (!gear) return;
    try {
      setIsUpdatingStatus(true);
      await tradeGearApi.updateGear(gear.id, { status: nextStatus });
      setGear((prev) => (prev ? { ...prev, status: nextStatus } : prev));
      setStatusValue(nextStatus);
    } catch (err) {
      const apiError = err as ApiError;
      const errorCode = apiError?.code as string | undefined;
      const messageByCode: Record<string, string> = {
        INVALID_TOKEN: '로그인이 필요합니다.',
        FORBIDDEN: '본인 글만 수정할 수 있습니다.',
        NOT_FOUND: '게시글이 존재하지 않거나 삭제되었습니다.',
        INTERNAL_SERVER_ERROR: '서버 오류로 처리에 실패했습니다.',
      };
      alert(messageByCode[errorCode] ?? apiError?.message ?? '상태 변경에 실패했습니다.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleBack = () => {
    if (typeof window === 'undefined') {
      router.push('/trade/gears');
      return;
    }

    const referrerPath = document.referrer
      ? new URL(document.referrer, window.location.origin).pathname
      : '';

    if (window.history.length > 1 && referrerPath === '/trade/gears') {
      router.back();
      return;
    }

    router.push('/trade/gears');
  };

  const openZoom = () => {
    setIsZoomOpen(true);
    requestAnimationFrame(() => setIsZoomVisible(true));
  };

  const closeZoom = () => {
    setIsZoomVisible(false);
    if (zoomTimeoutRef.current) {
      window.clearTimeout(zoomTimeoutRef.current);
    }
    zoomTimeoutRef.current = window.setTimeout(() => {
      setIsZoomOpen(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (zoomTimeoutRef.current) {
        window.clearTimeout(zoomTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-base font-semibold text-neutral-600 dark:text-neutral-400 hover:text-primary-600 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            돌아가기
          </button>
        </div>

        {isLoading ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">⏳</div>
            <p className="text-neutral-600 dark:text-neutral-400">로딩 중...</p>
          </div>
        ) : error || !gear ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-neutral-600 dark:text-neutral-400">{error}</p>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden">
                {hasImages ? (
                  <div
                    className="relative group"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerUp}
                  >
                    <div
                      className="flex transition-transform duration-500 ease-out"
                      style={{ transform: `translateX(-${safeIndex * 100}%)` }}
                    >
                    {imageUrls.map((url, index) => (
                      <div
                        key={`${url}-${index}`}
                        className="min-w-full flex items-center justify-center py-6"
                      >
                        <div className="w-full max-w-[520px] aspect-square rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center overflow-hidden">
                          <img
                            src={url}
                            alt={`${gear.title} 이미지 ${index + 1}`}
                            draggable={false}
                            className="w-full h-full object-contain cursor-zoom-in"
                            onClick={() => {
                              if (!isDragging) {
                                openZoom();
                              }
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                    {imageUrls.length > 1 && (
                      <>
                      <button
                        type="button"
                        aria-label="이전 이미지"
                        onClick={goPrev}
                        className={`absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 text-neutral-700 shadow-sm hover:bg-white transition-opacity cursor-pointer ${
                          safeIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`}
                      >
                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        aria-label="다음 이미지"
                        onClick={goNext}
                        className={`absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 text-neutral-700 shadow-sm hover:bg-white transition-opacity cursor-pointer ${
                          safeIndex === imageUrls.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-100'
                        }`}
                      >
                        <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                      </>
                    )}

                    <div className="absolute bottom-4 right-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white">
                      {safeIndex + 1}/{imageUrls.length}
                    </div>
                  </div>
                ) : (
                <div className="aspect-square max-w-[520px] w-full mx-auto flex items-center justify-center rounded-2xl bg-neutral-100 dark:bg-neutral-800 text-sm text-neutral-400">
                  이미지 없음
                </div>
              )}
              </div>

              {imageUrls.length > 0 && (
                <div className="flex justify-center">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {imageUrls.map((url, index) => (
                      <button
                        key={`thumb-${url}-${index}`}
                        type="button"
                        onClick={() => setSelectedIndex(index)}
                        aria-label={`${index + 1}번째 이미지`}
                        className={`h-16 w-16 flex-shrink-0 rounded-xl overflow-hidden border cursor-pointer ${
                          safeIndex === index
                            ? 'border-primary-500 ring-2 ring-primary-200'
                            : 'border-neutral-200 dark:border-neutral-800'
                        }`}
                      >
                      <img
                        src={url}
                        alt={`썸네일 ${index + 1}`}
                        draggable={false}
                        className="w-full h-full object-contain"
                      />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-5">
              <div className="space-y-3">
                <div className="text-xs font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  {topCategoryLabel ?? '대분류'}
                  {topCategoryLabel && topCategoryLabel !== TOP_CATEGORY_LABELS.etc && (
                    <>
                      {' '}
                      &gt; {categoryParts?.midKey ? MID_CATEGORY_LABELS[categoryParts.midKey] : '중분류'}
                      {' '}&gt;{' '}
                      {categoryParts?.detailKey ? DETAIL_CATEGORY_LABELS[categoryParts.detailKey] : '소분류'}
                    </>
                  )}
                </div>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-3xl font-bold text-foreground">{gear.title}</h1>
                    {gear.isAuthor ? (
                      <select
                        value={(effectiveStatus ?? gear.status) as GearStatus}
                        onChange={(event) =>
                          handleStatusChange(event.target.value as GearStatus)
                        }
                        disabled={isUpdatingStatus}
                        className="px-3 py-1.5 rounded-full border border-neutral-300 bg-white text-xs font-bold text-neutral-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-60 cursor-pointer"
                      >
                        {Object.values(GearStatus).map((status) => (
                          <option key={status} value={status}>
                            {STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                          STATUS_COLORS[effectiveStatus ?? gear.status]
                        }`}
                      >
                        {STATUS_LABELS[effectiveStatus ?? gear.status]}
                      </span>
                    )}
                  </div>
                  {gear.isAuthor && (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => router.push(`/trade/gears/${gear.id}/edit`)}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm hover:bg-primary-500 transition cursor-pointer"
                        aria-label="수정하기"
                        title="수정하기"
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5h-4a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"
                          />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-600 text-white shadow-sm hover:bg-red-500 transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                        aria-label={isDeleting ? '삭제 중...' : '삭제하기'}
                        title={isDeleting ? '삭제 중...' : '삭제하기'}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-3h4m-4 0a1 1 0 00-1 1v1h6V5a1 1 0 00-1-1m-4 0h4"
                          />
                        </svg>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold text-primary-700 dark:text-primary-300">
                    {gear.authorNickname}
                  </span>
                  <span>·</span>
                  <span>{getRelativeTime(gear.createdAt)}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    {gear.viewCount}
                  </span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-1">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    {gear.likeCount}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                  📍 {regionKey ? REGION_LABELS[regionKey] : REGION_LABELS[gear.region]}
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                  {conditionLabel}
                </span>
                <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-700 dark:bg-neutral-900 dark:text-neutral-200">
                  🚚 {tradeMethodLabel}
                </span>
              </div>

              <div className="inline-flex items-baseline gap-2 rounded-2xl bg-white dark:bg-neutral-900 px-4 py-3 shadow-sm">
                <span className="text-3xl font-extrabold text-foreground">
                  {gear.price.toLocaleString()}
                </span>
                <span className="text-sm font-semibold text-neutral-500">원</span>
              </div>

              <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 p-5">
                {descriptionHtml ? (
                  <div
                    className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                  />
                ) : (
                  <p className="text-sm text-neutral-400">상세 설명이 없습니다.</p>
                )}
              </div>

            </div>
          </div>
        )}
      </div>

      {isZoomOpen && selectedImage && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200 ${
            isZoomVisible ? 'bg-black/80 opacity-100' : 'bg-black/0 opacity-0'
          }`}
          onClick={closeZoom}
        >
          <button
            type="button"
            onClick={closeZoom}
            className="absolute top-6 right-6 h-10 w-10 rounded-full bg-white/90 text-neutral-700 shadow-sm cursor-pointer"
            aria-label="확대 이미지 닫기"
          >
            ✕
          </button>
          <img
            src={selectedImage}
            alt={`${gear?.title ?? ''} 확대 이미지`}
            draggable={false}
            className={`max-h-[90vh] max-w-[90vw] object-contain transition-transform duration-200 ${
              isZoomVisible ? 'scale-100' : 'scale-95'
            }`}
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
