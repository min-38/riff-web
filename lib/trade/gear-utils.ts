import type { GearResponse } from '@/lib/api/types';
import { PUBLIC_STORAGE_BASE_URL } from '@/lib/config/publicEnv';

const normalizeToken = (value: string) =>
  value.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');

const CACHE_BUST = Date.now();

export const appendCacheBust = (url: string): string => {
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${CACHE_BUST}`;
};

export const resolveEnumValue = <T extends string>(
  value: T | number | string | null | undefined,
  order: T[],
  labels?: Record<T, string>
): T | undefined => {
  if (typeof value === 'number') {
    return order[value];
  }

  if (typeof value === 'string') {
    if (order.includes(value as T)) {
      return value as T;
    }

    const normalizedValue = normalizeToken(value);
    const matchByValue = order.find(
      (item) => normalizeToken(item) === normalizedValue
    );
    if (matchByValue) return matchByValue;

    if (labels) {
      const matchByLabel = order.find(
        (item) => normalizeToken(labels[item]) === normalizedValue
      );
      if (matchByLabel) return matchByLabel;
    }
  }

  return undefined;
};

export const resolveGearImageUrl = (
  images?: GearResponse['images']
): string | undefined => {
  const urls = images?.urls;
  if (!urls || urls.length === 0) return undefined;

  const mainIndex = images?.mainIndex ?? 0;
  const clampedIndex = Math.min(Math.max(mainIndex, 0), urls.length - 1);
  const rawUrl = urls[clampedIndex];

  if (!rawUrl) return undefined;
  if (/^https?:\/\//i.test(rawUrl)) return rawUrl;

  const baseUrl = (images?.public_base_url || PUBLIC_STORAGE_BASE_URL || '').replace(
    /\/$/,
    ''
  );
  if (!baseUrl) return appendCacheBust(rawUrl);

  const path = rawUrl.replace(/^\//, '');
  return appendCacheBust(`${baseUrl}/${path}`);
};
