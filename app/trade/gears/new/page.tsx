'use client';

import { useState, useRef, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Underline from '@tiptap/extension-underline';
import Header from '@/components/Header';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { tradeGearApi } from '@/lib/api/tradeGear';
import { isAuthenticated, getUserFromToken } from '@/lib/auth/token';
import {
  GearCategory,
  GearSubCategory,
  GearDetailCategory,
  GearCondition,
  GearStatus,
  TradeMethod,
  Region,
  type ApiError,
} from '@/lib/api/types';
import {
  TOP_CATEGORY_LABELS,
  MID_CATEGORY_LABELS,
  DETAIL_CATEGORY_LABELS,
  TOP_CATEGORY_MID_MAPPING,
  MID_DETAIL_MAPPING,
  CONDITION_LABELS as conditionLabels,
  TRADE_METHOD_LABELS as tradeMethodLabels,
  REGION_LABELS as regionLabels,
  STATUS_COLORS,
  STATUS_LABELS,
  type TopCategoryKey,
  type MidCategoryKey,
  type DetailCategoryKey,
} from '@/lib/trade/gear-constants';

interface FormErrors {
  title?: string;
  description?: string;
  price?: string;
  topCategory?: string;
  category?: string;
  subCategory?: string;
  tradeMethod?: string;
  region?: string;
  images?: string;
  general?: string;
}


// 가격 포맷 함수
const formatPrice = (value: string): string => {
  const numbers = value.replace(/[^\d]/g, '');
  if (!numbers) return '';
  return Number(numbers).toLocaleString('ko-KR');
};

const parsePrice = (value: string): string => {
  return value.replace(/[^\d]/g, '');
};

// HTML을 간단한 마크다운으로 변환
const htmlToMarkdown = (html: string): string => {
  let markdown = html;

  // <pre><code> -> ```
  markdown = markdown.replace(
    /<pre[^>]*><code[^>]*>([\s\S]*?)<\/code><\/pre>/gi,
    (_match, content) => `\n\`\`\`\n${content.trim()}\n\`\`\`\n`
  );

  // <h1>, <h2>, <h3> -> ##
  markdown = markdown.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n');
  markdown = markdown.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n');
  markdown = markdown.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n');

  // <blockquote> -> >
  markdown = markdown.replace(
    /<blockquote[^>]*>(.*?)<\/blockquote>/gis,
    (match, content) => {
      const lines = content.trim().split('\n');
      return (
        '\n' + lines.map((line: string) => `> ${line.trim()}`).join('\n') + '\n'
      );
    }
  );

  // <a> -> [text](url)
  markdown = markdown.replace(
    /<a[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi,
    '[$2]($1)'
  );

  // <strong>, <b> -> **
  markdown = markdown.replace(/<strong>(.*?)<\/strong>/g, '**$1**');
  markdown = markdown.replace(/<b>(.*?)<\/b>/g, '**$1**');

  // <em>, <i> -> *
  markdown = markdown.replace(/<em>(.*?)<\/em>/g, '*$1*');
  markdown = markdown.replace(/<i>(.*?)<\/i>/g, '*$1*');

  // <s>, <del>, <strike> -> ~~
  markdown = markdown.replace(/<s>(.*?)<\/s>/g, '~~$1~~');
  markdown = markdown.replace(/<del>(.*?)<\/del>/g, '~~$1~~');
  markdown = markdown.replace(/<strike>(.*?)<\/strike>/g, '~~$1~~');

  // <code> -> `
  markdown = markdown.replace(/<code>(.*?)<\/code>/g, '`$1`');

  // <u> -> (markdown doesn't have underline, keep as is)
  markdown = markdown.replace(/<u>(.*?)<\/u>/g, '$1');

  // <ol><li> -> 1.
  markdown = markdown.replace(/<ol[^>]*>(.*?)<\/ol>/gis, (match, content) => {
    let counter = 1;
    const replaced = content.replace(
      /<li[^>]*>(.*?)<\/li>/gi,
      (_: string, item: string) => {
        return `${counter++}. ${item.trim()}\n`;
      }
    );
    return '\n' + replaced;
  });

  // <ul><li> -> *
  markdown = markdown.replace(/<ul[^>]*>(.*?)<\/ul>/gis, (match, content) => {
    const replaced = content.replace(
      /<li[^>]*>(.*?)<\/li>/gi,
      (_: string, item: string) => {
        return `* ${item.trim()}\n`;
      }
    );
    return '\n' + replaced;
  });

  // 남은 <li> 태그 처리 (중첩되지 않은 것들)
  markdown = markdown.replace(/<li[^>]*>(.*?)<\/li>/gi, '* $1\n');

  // <br> -> \n
  markdown = markdown.replace(/<br\s*\/?>/g, '\n');

  // <hr> -> ---
  markdown = markdown.replace(/<hr\s*\/?>/g, '\n---\n');

  // <div> -> \n
  markdown = markdown.replace(/<div[^>]*>/g, '\n');
  markdown = markdown.replace(/<\/div>/g, '');

  // <p> 태그 제거
  markdown = markdown.replace(/<p[^>]*>/g, '');
  markdown = markdown.replace(/<\/p>/g, '\n');

  // 남은 HTML 태그 제거
  markdown = markdown.replace(/<[^>]+>/g, '');

  // HTML 엔티티 디코딩
  markdown = markdown.replace(/&nbsp;/g, ' ');
  markdown = markdown.replace(/&lt;/g, '<');
  markdown = markdown.replace(/&gt;/g, '>');
  markdown = markdown.replace(/&amp;/g, '&');
  markdown = markdown.replace(/&quot;/g, '"');

  // 연속된 줄바꿈을 2개까지만
  markdown = markdown.replace(/\n{3,}/g, '\n\n');

  return markdown.trim();
};

const readFilePreview = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () =>
      reject(new Error('이미지 미리보기를 불러오지 못했습니다.'));
    reader.readAsDataURL(file);
  });
};

const normalizeDropIndex = (from: number, to: number, length: number) => {
  const clamped = Math.max(0, Math.min(to, length));
  return from < clamped ? clamped - 1 : clamped;
};

const reorderItems = <T,>(items: T[], from: number, to: number): T[] => {
  const next = [...items];
  const target = normalizeDropIndex(from, to, items.length);
  const [moved] = next.splice(from, 1);
  next.splice(target, 0, moved);
  return next;
};

const shiftRepresentativeIndex = (
  from: number,
  to: number,
  representative: number,
  length: number
): number => {
  const target = normalizeDropIndex(from, to, length);
  if (from === representative) return target;
  if (from < representative && target >= representative) return representative - 1;
  if (from > representative && target <= representative) return representative + 1;
  return representative;
};

export default function NewInstrumentPage() {
  const router = useRouter();
  const uploadAreaRef = useRef<HTMLDivElement>(null);

  // Tiptap 에디터
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-blue-600 underline',
        },
      }),
    ],
    content: '',
    onCreate: ({ editor }) => {
      setDescriptionLength(editor.getText().trim().length);
    },
    onUpdate: ({ editor }) => {
      setDescriptionLength(editor.getText().trim().length);
    },
    editorProps: {
      attributes: {
        class:
          'tiptap-content max-w-none focus:outline-none min-h-[350px] px-4 py-4',
      },
    },
  });

  // 폼 상태
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [displayPrice, setDisplayPrice] = useState('');
  const [topCategory, setTopCategory] = useState<TopCategoryKey | ''>('');
  const [category, setCategory] = useState<MidCategoryKey | ''>('');
  const [subCategory, setSubCategory] = useState<DetailCategoryKey | ''>('');
  const [condition, setCondition] = useState<GearCondition | ''>('');
  const [tradeMethod, setTradeMethod] = useState<TradeMethod | ''>('');
  const [region, setRegion] = useState<Region | ''>('');
  const [descriptionLength, setDescriptionLength] = useState(0);
  const previewAuthor = getUserFromToken()?.nickname || '나';

  // 이미지 상태
  const [images, setImages] = useState<Array<{ file: File; preview: string }>>(
    []
  );
  const [representativeIndex, setRepresentativeIndex] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const dragIndexRef = useRef<number | null>(null);
  const dragOverIndexRef = useRef<number | null>(null);
  const itemRefs = useRef<Array<HTMLDivElement | null>>([]);
  const [dragState, setDragState] = useState<{
    index: number;
    x: number;
    y: number;
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  // UI 상태
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const representativePreview =
    images.length > 0
      ? images[Math.min(representativeIndex, images.length - 1)]?.preview
      : null;
  const descriptionOk =
    descriptionLength >= 15 && descriptionLength <= 1000;
  const isTopEtc = topCategory === 'etc';
  const isMidOther = category === 'other';
  const requiresMid = topCategory !== '' && !isTopEtc;
  const requiresDetail = requiresMid && category !== '' && !isMidOther;
  const requiredFields = [
    title.trim(),
    price.trim(),
    topCategory,
    requiresMid ? category : 'ok',
    requiresDetail ? subCategory : 'ok',
    condition,
    tradeMethod,
    region,
    images.length > 0 ? 'ok' : '',
    descriptionOk ? 'ok' : '',
  ];
  const completedCount = requiredFields.filter(Boolean).length;
  const requiredCount = requiredFields.length;
  const progressPercent = Math.round((completedCount / requiredCount) * 100);
  const displayImages = (() => {
    if (
      dragIndex === null ||
      dragOverIndex === null ||
      dragIndex === dragOverIndex
    ) {
      return images.map((image, index) => ({
        type: 'image' as const,
        image,
        originalIndex: index,
      }));
    }

    const withoutDragged = images.filter((_, index) => index !== dragIndex);
    const rawInsertIndex =
      dragOverIndex > dragIndex ? dragOverIndex - 1 : dragOverIndex;
    const insertIndex = Math.max(
      0,
      Math.min(rawInsertIndex, withoutDragged.length)
    );
    const items: Array<
      | {
          type: 'image';
          image: { file: File; preview: string };
          originalIndex: number;
        }
      | { type: 'placeholder'; targetIndex: number }
    > = [];

    withoutDragged.forEach((image, index) => {
      if (index === insertIndex) {
        items.push({ type: 'placeholder', targetIndex: dragOverIndex });
      }
      const originalIndex = index >= dragIndex ? index + 1 : index;
      items.push({ type: 'image', image, originalIndex });
    });

    if (insertIndex >= withoutDragged.length) {
      items.push({ type: 'placeholder', targetIndex: dragOverIndex });
    }

    return items;
  })();

  // 인증 확인
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
    } else {
      setIsCheckingAuth(false);
    }
  }, [router]);

  // 카테고리 변경 시 서브카테고리 초기화
  useEffect(() => {
    if (topCategory === 'etc' && category === 'other') {
      return;
    }
    setSubCategory('');
  }, [category, topCategory]);

  useEffect(() => {
    if (topCategory === '') {
      setCategory('');
      setSubCategory('');
      return;
    }

    if (topCategory === 'etc') {
      setCategory('other');
      setSubCategory('other');
      return;
    }

    if (category && !TOP_CATEGORY_MID_MAPPING[topCategory].includes(category)) {
      setCategory('');
      setSubCategory('');
    }
  }, [topCategory, category]);

  // 가격 입력 처리
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const numericValue = parsePrice(inputValue);
    setPrice(numericValue);
    setDisplayPrice(formatPrice(inputValue));
  };

  // 파일 처리 공통 함수
  const processFiles = (files: FileList | File[]) => {
    const newFiles = Array.from(files);
    const availableSlots = Math.max(0, 10 - images.length);
    const warningMessage =
      newFiles.length > availableSlots
        ? '이미지는 최대 10개까지 업로드할 수 있습니다. 초과된 이미지는 제외했어요.'
        : null;

    if (availableSlots === 0) {
      setErrors((prev) => ({
        ...prev,
        images: warningMessage || '이미지는 최대 10개까지 업로드할 수 있습니다.',
      }));
      return;
    }

    const limitedFiles = newFiles.slice(0, availableSlots);

    const invalidFiles = limitedFiles.filter(
      (file) => file.size > 5 * 1024 * 1024
    );
    if (invalidFiles.length > 0) {
      setErrors((prev) => ({
        ...prev,
        images: '이미지 파일은 5MB 이하여야 합니다.',
      }));
      return;
    }

    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const nonImageFiles = limitedFiles.filter(
      (file) => !validImageTypes.includes(file.type)
    );
    if (nonImageFiles.length > 0) {
      setErrors((prev) => ({
        ...prev,
        images: '이미지 파일만 업로드할 수 있습니다. (JPG, PNG, GIF, WEBP)',
      }));
      return;
    }

    setErrors((prev) => ({
      ...prev,
      images: warningMessage || undefined,
    }));

    void (async () => {
      try {
        const previews = await Promise.all(limitedFiles.map(readFilePreview));
        setImages((prev) => {
          const next = [
            ...prev,
            ...limitedFiles.map((file, index) => ({
              file,
              preview: previews[index],
            })),
          ];
          if (prev.length === 0 && next.length > 0) {
            setRepresentativeIndex(0);
          }
          return next;
        });
      } catch (error) {
        setErrors((prev) => ({
          ...prev,
          images:
            (error as Error).message ||
            '이미지를 미리보기로 불러오지 못했습니다.',
        }));
      }
    })();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    processFiles(files);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploadAreaRef.current && !uploadAreaRef.current.contains(e.relatedTarget as Node)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setRepresentativeIndex((prev) => {
      if (index === prev) {
        return 0;
      }
      if (index < prev) {
        return prev - 1;
      }
      return prev;
    });
  };

  const handleSetRepresentative = (index: number) => {
    setRepresentativeIndex(index);
  };

  const updateDragIndex = (value: number | null) => {
    dragIndexRef.current = value;
    setDragIndex(value);
  };

  const updateDragOverIndex = (value: number | null) => {
    dragOverIndexRef.current = value;
    setDragOverIndex(value);
  };

  const getClosestIndex = (x: number, y: number) => {
    let closestIndex: number | null = null;
    let closestDistance = Number.POSITIVE_INFINITY;

    itemRefs.current.forEach((item, index) => {
      if (!item || index === dragIndexRef.current) return;
      const rect = item.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = (x - centerX) ** 2 + (y - centerY) ** 2;
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    return closestIndex ?? dragIndexRef.current;
  };

  const getDropIndex = (x: number, y: number) => {
    const items = itemRefs.current
      .map((item, index) => {
        if (!item || index === dragIndexRef.current) return null;
        return { index, rect: item.getBoundingClientRect() };
      })
      .filter(Boolean) as Array<{ index: number; rect: DOMRect }>;

    if (items.length === 0) return 0;

    const firstRect = items[0].rect;
    const lastRect = items[items.length - 1].rect;

    if (y < firstRect.top) return 0;
    if (y > lastRect.bottom) return images.length;
    if (y >= lastRect.top && y <= lastRect.bottom && x > lastRect.right) {
      return images.length;
    }
    if (y >= firstRect.top && y <= firstRect.bottom && x < firstRect.left) {
      return 0;
    }

    for (const item of items) {
      const { rect, index } = item;
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= rect.top &&
        y <= rect.bottom
      ) {
        return x > rect.left + rect.width / 2 ? index + 1 : index;
      }
    }

    const closestIndex = getClosestIndex(x, y);
    if (closestIndex === null) return images.length;
    const closestRect = itemRefs.current[closestIndex]?.getBoundingClientRect();
    if (!closestRect) return closestIndex;
    return x > closestRect.left + closestRect.width / 2
      ? closestIndex + 1
      : closestIndex;
  };

  const handlePointerMove = (event: PointerEvent) => {
    setDragState((prev) =>
      prev ? { ...prev, x: event.clientX, y: event.clientY } : prev
    );

    const element = document.elementFromPoint(
      event.clientX,
      event.clientY
    ) as HTMLElement | null;
    const placeholderEl = element?.closest(
      '[data-placeholder-index]'
    ) as HTMLElement | null;

    const placeholderIndex = placeholderEl
      ? Number(placeholderEl.dataset.placeholderIndex)
      : null;
    const nextIndex =
      placeholderIndex ?? getDropIndex(event.clientX, event.clientY);

    if (nextIndex !== null && nextIndex !== dragOverIndexRef.current) {
      updateDragOverIndex(nextIndex);
    }
  };

  const handlePointerUp = () => {
    const fromIndex = dragIndexRef.current;
    const toIndex = dragOverIndexRef.current;

    if (
      fromIndex !== null &&
      toIndex !== null &&
      fromIndex !== toIndex
    ) {
      setImages((prev) => reorderItems(prev, fromIndex, toIndex));
      setRepresentativeIndex((prev) =>
        shiftRepresentativeIndex(fromIndex, toIndex, prev, images.length)
      );
    }

    updateDragIndex(null);
    updateDragOverIndex(null);
    setDragState(null);
    document.body.style.userSelect = '';
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerUp);
  };

  const handlePointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
    index: number
  ) => {
    const target = itemRefs.current[index];
    if (!target) return;
    const rect = target.getBoundingClientRect();

    event.preventDefault();
    if (event.currentTarget.setPointerCapture) {
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    updateDragIndex(index);
    updateDragOverIndex(index);
    setDragState({
      index,
      x: event.clientX,
      y: event.clientY,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    });

    document.body.style.userSelect = 'none';
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Tiptap 링크 삽입
  const setLink = () => {
    if (!editor) return;

    const url = prompt('링크 URL을 입력하세요:');
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  // 폼 제출
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const newErrors: FormErrors = {};

    if (!title.trim()) {
      newErrors.title = '제목을 입력해주세요.';
    }

    const editorText = editor?.getText() || '';
    const descriptionCount = editorText.trim().length;
    if (descriptionCount < 15 || descriptionCount > 1000) {
      newErrors.description = '설명은 15자 이상 1000자 이하여야 합니다.';
    }

    const priceNum = parseInt(price);
    if (!price || isNaN(priceNum) || priceNum < 0) {
      newErrors.price = '올바른 가격을 입력해주세요.';
    }

    if (!topCategory) {
      newErrors.topCategory = '대분류를 선택해주세요.';
    }

    if (requiresMid && !category) {
      newErrors.category = '중분류를 선택해주세요.';
    }

    if (requiresDetail && !subCategory) {
      newErrors.subCategory = '소분류를 선택해주세요.';
    }

    if (!condition) {
      newErrors.condition = '상태를 선택해주세요.';
    }

    if (!tradeMethod) {
      newErrors.tradeMethod = '거래 방식을 선택해주세요.';
    }

    if (!region) {
      newErrors.region = '거래 지역을 선택해주세요.';
    }

    if (images.length === 0) {
      newErrors.images = '최소 1개 이상의 이미지를 업로드해주세요.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const editorHTML = editor?.getHTML() || '';
      const markdownDescription = htmlToMarkdown(editorHTML);
      const representativeSafeIndex =
        images.length > 0
          ? Math.min(representativeIndex, images.length - 1)
          : 0;

      const resolvedCategory =
        topCategory === 'etc' ? 'etc' : topCategory;
      const resolvedSubCategory =
        topCategory === 'etc' ? 'other' : category;
      const resolvedDetailCategory =
        topCategory === 'etc' || isMidOther ? 'other' : subCategory;

      const response = await tradeGearApi.createGear(
        {
          title: title.trim(),
          description: markdownDescription,
          price: priceNum,
          category: resolvedCategory as GearCategory,
          subCategory: resolvedSubCategory as GearSubCategory,
          detailCategory: resolvedDetailCategory as GearDetailCategory,
          condition: condition || undefined,
          tradeMethod: tradeMethod as TradeMethod,
          region: region as Region,
          mainImageIndex: representativeSafeIndex,
        },
        images.map((image) => image.file)
      );

      router.push(`/trade/gears/${response.id}`);
    } catch (error) {
      const apiError = error as ApiError;
      setErrors({
        general:
          apiError.message ||
          '게시글 작성에 실패했습니다. 잠시 후 다시 시도해주세요.',
      });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen" style={{ background: 'var(--background)' }}>
        <Header />
        <div className="max-w-4xl mx-auto px-4 py-12 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-neutral-200 dark:bg-neutral-800 rounded w-1/3 mx-auto mb-4"></div>
            <div className="h-4 bg-neutral-200 dark:bg-neutral-800 rounded w-1/2 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--background)' }}>
      <Header />

      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
            악기 거래 게시글 작성
          </h1>
          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400">
            판매할 악기의 정보를 입력해주세요
          </p>
        </div>

        {errors.general && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border-l-4 border-red-500">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <p className="text-base text-red-700 dark:text-red-400 font-medium">
                {errors.general}
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 1. 제목 */}
            <div className="p-6 sm:p-8 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                    제목
                  </h2>
                </div>
              </div>
              <Input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="예) 펜더 스트랫 미국산 판매합니다"
                error={errors.title}
                fullWidth
                className="text-lg"
              />
            </div>

          {/* 2. 장비 정보 */}
          <div className="p-6 sm:p-8 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">🧰</span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                장비 정보
              </h2>
            </div>
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    대분류
                  </label>
                  <select
                    value={topCategory}
                    onChange={(e) => setTopCategory(e.target.value as TopCategoryKey)}
                    className={`
                      w-full px-4 py-3.5 text-base font-medium
                      border-2 ${errors.topCategory ? 'border-red-400 dark:border-red-600' : 'border-neutral-300 dark:border-neutral-700'}
                      rounded-xl
                      bg-white dark:bg-neutral-950 text-foreground
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                      transition-all cursor-pointer
                      hover:border-primary-400 dark:hover:border-primary-600
                    `}
                  >
                    <option value="">선택해주세요</option>
                    {Object.entries(TOP_CATEGORY_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                  {errors.topCategory && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                      {errors.topCategory}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    중분류
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as MidCategoryKey)}
                    disabled={!topCategory || topCategory === 'etc'}
                    className={`
                      w-full px-4 py-3.5 text-base font-medium
                      border-2 ${errors.category ? 'border-red-400 dark:border-red-600' : 'border-neutral-300 dark:border-neutral-700'}
                      rounded-xl
                      bg-white dark:bg-neutral-950 text-foreground
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                      disabled:bg-neutral-100 dark:disabled:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60
                      transition-all cursor-pointer
                      hover:border-primary-400 dark:hover:border-primary-600
                    `}
                  >
                    <option value="">선택해주세요</option>
                    {topCategory &&
                      topCategory !== 'etc' &&
                      TOP_CATEGORY_MID_MAPPING[topCategory].map((midCat) => (
                        <option key={midCat} value={midCat}>
                          {MID_CATEGORY_LABELS[midCat]}
                        </option>
                      ))}
                  </select>
                  {errors.category && (
                    <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                      {errors.category}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                    소분류
                  </label>
                  <select
                    value={subCategory}
                    onChange={(e) =>
                      setSubCategory(e.target.value as DetailCategoryKey)
                    }
                    disabled={!category || topCategory === 'etc' || category === 'other'}
                    className={`
                      w-full px-4 py-3.5 text-base font-medium
                      border-2 ${errors.subCategory ? 'border-red-400 dark:border-red-600' : 'border-neutral-300 dark:border-neutral-700'}
                      rounded-xl
                      bg-white dark:bg-neutral-950 text-foreground
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                        disabled:bg-neutral-100 dark:disabled:bg-neutral-900 disabled:cursor-not-allowed disabled:opacity-60
                        transition-all cursor-pointer
                        hover:border-primary-400 dark:hover:border-primary-600
                    `}
                  >
                    <option value="">선택해주세요</option>
                    {category &&
                      category !== 'other' &&
                      MID_DETAIL_MAPPING[category].map((subCat) => (
                        <option key={subCat} value={subCat}>
                          {DETAIL_CATEGORY_LABELS[subCat]}
                        </option>
                      ))}
                  </select>
                    {errors.subCategory && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                        {errors.subCategory}
                      </p>
                    )}
                </div>
              </div>

              <div className="border-t border-neutral-200 dark:border-neutral-800 pt-6">

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      가격
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={displayPrice}
                        onChange={handlePriceChange}
                        placeholder="0"
                        className={`
                          w-full px-4 py-3.5 pr-12 text-base font-semibold
                          border-2 ${errors.price ? 'border-red-400 dark:border-red-600' : 'border-neutral-300 dark:border-neutral-700'}
                          rounded-xl
                          bg-white dark:bg-neutral-950 text-foreground
                          placeholder:text-neutral-400 dark:placeholder:text-neutral-600
                          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                          transition-all
                        `}
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-base font-semibold text-neutral-500 dark:text-neutral-400">
                        원
                      </span>
                    </div>
                    {errors.price && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                        {errors.price}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        상태
                      </label>
                      <select
                        value={condition}
                        onChange={(e) => setCondition(e.target.value as GearCondition)}
                        className={`
                          w-full px-4 py-3.5 text-base font-medium
                          border-2 ${errors.condition ? 'border-red-400 dark:border-red-600' : 'border-neutral-300 dark:border-neutral-700'}
                          rounded-xl
                          bg-white dark:bg-neutral-950 text-foreground
                          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                          transition-all cursor-pointer
                          hover:border-primary-400 dark:hover:border-primary-600
                        `}
                      >
                        <option value="">선택해주세요</option>
                        {Object.values(GearCondition).map((cond) => (
                          <option key={cond} value={cond}>
                            {conditionLabels[cond]}
                          </option>
                        ))}
                      </select>
                      {errors.condition && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                          {errors.condition}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        거래 방식
                      </label>
                      <select
                        value={tradeMethod}
                        onChange={(e) => setTradeMethod(e.target.value as TradeMethod)}
                        className={`
                          w-full px-4 py-3.5 text-base font-medium
                          border-2 ${errors.tradeMethod ? 'border-red-400 dark:border-red-600' : 'border-neutral-300 dark:border-neutral-700'}
                          rounded-xl
                          bg-white dark:bg-neutral-950 text-foreground
                          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                          transition-all cursor-pointer
                          hover:border-primary-400 dark:hover:border-primary-600
                        `}
                      >
                        <option value="">선택해주세요</option>
                        {Object.values(TradeMethod).map((method) => (
                          <option key={method} value={method}>
                            {tradeMethodLabels[method]}
                          </option>
                        ))}
                      </select>
                      {errors.tradeMethod && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                          {errors.tradeMethod}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                        거래 지역
                      </label>
                      <select
                        value={region}
                        onChange={(e) => setRegion(e.target.value as Region)}
                        className={`
                          w-full px-4 py-3.5 text-base font-medium
                          border-2 ${errors.region ? 'border-red-400 dark:border-red-600' : 'border-neutral-300 dark:border-neutral-700'}
                          rounded-xl
                          bg-white dark:bg-neutral-950 text-foreground
                          focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent
                          transition-all cursor-pointer
                          hover:border-primary-400 dark:hover:border-primary-600
                        `}
                      >
                        <option value="">선택해주세요</option>
                        {Object.values(Region).map((reg) => (
                          <option key={reg} value={reg}>
                            📍 {regionLabels[reg]}
                          </option>
                        ))}
                      </select>
                      {errors.region && (
                        <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                          {errors.region}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 4. 이미지 업로드 */}
          <div
            ref={uploadAreaRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`
              p-6 sm:p-8 rounded-2xl border-2
              ${isDragging ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/50' : 'border-neutral-200 dark:border-neutral-800'}
              bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900
              shadow-sm hover:shadow-md transition-all
            `}
          >
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">{isDragging ? '📥' : '📸'}</span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                {isDragging ? '여기에 이미지를 놓으세요!' : '이미지 업로드'}
              </h2>
            </div>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="image-upload"
                  className="group relative block w-full p-8 sm:p-12 rounded-xl border-3 border-dashed border-neutral-300 dark:border-neutral-700 hover:border-primary-500 dark:hover:border-primary-500 cursor-pointer transition-all bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-950 hover:from-primary-50 hover:to-white dark:hover:from-primary-950/30 dark:hover:to-neutral-950"
                >
                  <div className="text-center">
                    <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                      📷
                    </div>
                    <p className="text-base sm:text-lg font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
                      클릭하여 이미지 선택 또는 이미지 드래그 앤 드롭
                    </p>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                      최대 10개 · 각 5MB 이하 · JPG, PNG, GIF, WEBP
                    </p>
                  </div>
                </label>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageChange}
                  className="hidden"
                />
                {errors.images && (
                  <p className="mt-3 text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
                    <span>⚠️</span>
                    {errors.images}
                  </p>
                )}
              </div>

              {images.length > 0 && (
                <div>
                  <p className="text-sm font-semibold text-neutral-600 dark:text-neutral-400 mb-3">
                    선택된 이미지 ({images.length}/10)
                  </p>
                  <p className="text-xs text-neutral-500 dark:text-neutral-500 mb-3">
                    드래그로 순서를 바꾸고, 대표 이미지를 선택할 수 있어요.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {displayImages.map((item, index) => {
                      if (item.type === 'placeholder') {
                        return (
                          <div
                            key={`placeholder-${index}`}
                            data-placeholder-index={item.targetIndex}
                            className="rounded-xl border-2 border-dashed border-primary-500 bg-primary-500/10 min-h-[140px] flex items-center justify-center text-xs font-semibold text-primary-700 dark:text-primary-300"
                          >
                            여기에 놓기
                          </div>
                        );
                      }

                      const image = item.image;
                      const originalIndex = item.originalIndex;
                      return (
                        <div
                          key={`${image.file.name}-${originalIndex}`}
                          data-image-index={originalIndex}
                          className={`relative group cursor-move transition-transform ${
                            dragIndex === originalIndex && dragState
                              ? 'opacity-0'
                              : ''
                          }`}
                          onPointerDown={(event) => handlePointerDown(event, originalIndex)}
                          ref={(element) => {
                            itemRefs.current[originalIndex] = element;
                          }}
                          style={{ touchAction: 'none' }}
                        >
                          <div className="rounded-xl overflow-hidden border-2 border-neutral-200 dark:border-neutral-800 shadow-sm group-hover:shadow-lg transition-all">
                            <img
                              src={image.preview}
                              alt={`Preview ${originalIndex + 1}`}
                              className="w-full h-auto object-contain bg-neutral-100 dark:bg-neutral-900 max-h-48"
                            />
                          </div>
                          {originalIndex !== representativeIndex && (
                            <button
                              type="button"
                              onClick={() => handleSetRepresentative(originalIndex)}
                              onPointerDown={(event) => event.stopPropagation()}
                              className="absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-semibold bg-white/90 dark:bg-neutral-900/90 text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 shadow-sm hover:shadow-md transition"
                              title="대표 이미지로 설정"
                            >
                              대표로 설정
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(originalIndex)}
                            onPointerDown={(event) => event.stopPropagation()}
                            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg font-bold cursor-pointer"
                            title="이미지 삭제"
                          >
                            ✕
                          </button>
                          <button
                            type="button"
                            onClick={() => setZoomImage(image.preview)}
                            onPointerDown={(event) => event.stopPropagation()}
                            className="absolute bottom-2 right-2 w-9 h-9 bg-neutral-900/70 hover:bg-neutral-900/90 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                            title="이미지 확대"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <circle cx="11" cy="11" r="7" strokeWidth={2} />
                              <line x1="16.65" y1="16.65" x2="21" y2="21" strokeWidth={2} strokeLinecap="round" />
                            </svg>
                          </button>
                          {originalIndex === representativeIndex && (
                            <div className="absolute top-2 left-2 bg-primary-600 text-white text-xs px-2 py-1 rounded-full font-semibold shadow-lg">
                              대표
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 5. 상세 설명 */}
          <div className="p-6 sm:p-8 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-gradient-to-br from-white to-neutral-50 dark:from-neutral-950 dark:to-neutral-900 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-2xl">✍️</span>
              <h2 className="text-xl sm:text-2xl font-bold text-foreground">
                상세 설명
              </h2>
            </div>
            {editor && (
              <div className="mb-3 p-2 bg-neutral-50 dark:bg-neutral-900/50 rounded-lg border border-neutral-200 dark:border-neutral-800">
                <div className="flex flex-wrap gap-1">
                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBold().run()}
                    className={`p-2 ${editor.isActive('bold') ? 'bg-neutral-200 dark:bg-neutral-700' : ''} text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors`}
                    title="굵게 (Ctrl+B)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleItalic().run()}
                    className={`p-2 ${editor.isActive('italic') ? 'bg-neutral-200 dark:bg-neutral-700' : ''} text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors`}
                    title="기울임 (Ctrl+I)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="19" y1="4" x2="10" y2="4" strokeWidth={2} strokeLinecap="round"/>
                      <line x1="14" y1="20" x2="5" y2="20" strokeWidth={2} strokeLinecap="round"/>
                      <line x1="15" y1="4" x2="9" y2="20" strokeWidth={2} strokeLinecap="round"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleUnderline().run()}
                    className={`p-2 ${editor.isActive('underline') ? 'bg-neutral-200 dark:bg-neutral-700' : ''} text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors`}
                    title="밑줄 (Ctrl+U)"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v6a5 5 0 0010 0V4" />
                      <line x1="5" y1="20" x2="19" y2="20" strokeWidth={2} strokeLinecap="round"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleStrike().run()}
                    className={`p-2 ${editor.isActive('strike') ? 'bg-neutral-200 dark:bg-neutral-700' : ''} text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors`}
                    title="취소선"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="4" y1="12" x2="20" y2="12" strokeWidth={2} strokeLinecap="round"/>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h8M9 18h6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={setLink}
                    className={`p-2 ${editor.isActive('link') ? 'bg-neutral-200 dark:bg-neutral-700' : ''} text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors`}
                    title="링크 삽입"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCode().run()}
                    className={`p-2 ${editor.isActive('code') ? 'bg-neutral-200 dark:bg-neutral-700' : ''} text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors`}
                    title="코드"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l-4 5 4 5M16 7l4 5-4 5" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                    className={`p-2 ${editor.isActive('codeBlock') ? 'bg-neutral-200 dark:bg-neutral-700' : ''} text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors`}
                    title="코드 블록"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8l-3 4 3 4M17 8l3 4-3 4" />
                      <line x1="10" y1="6" x2="14" y2="18" strokeWidth={2} strokeLinecap="round"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleOrderedList().run()}
                    className={`p-2 ${editor.isActive('orderedList') ? 'bg-neutral-200 dark:bg-neutral-700' : ''} text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors`}
                    title="번호 매기기"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="10" y1="6" x2="21" y2="6" strokeWidth={2} strokeLinecap="round"/>
                      <line x1="10" y1="12" x2="21" y2="12" strokeWidth={2} strokeLinecap="round"/>
                      <line x1="10" y1="18" x2="21" y2="18" strokeWidth={2} strokeLinecap="round"/>
                      <path d="M4 6h1v4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 12h2a1 1 0 011 1v0a1 1 0 01-1 1H4" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M4 18h2" strokeWidth={2} strokeLinecap="round"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBulletList().run()}
                    className={`p-2 ${editor.isActive('bulletList') ? 'bg-neutral-200 dark:bg-neutral-700' : ''} text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors`}
                    title="글머리 기호"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="9" y1="6" x2="20" y2="6" strokeWidth={2} strokeLinecap="round"/>
                      <line x1="9" y1="12" x2="20" y2="12" strokeWidth={2} strokeLinecap="round"/>
                      <line x1="9" y1="18" x2="20" y2="18" strokeWidth={2} strokeLinecap="round"/>
                      <circle cx="4" cy="6" r="1" fill="currentColor"/>
                      <circle cx="4" cy="12" r="1" fill="currentColor"/>
                      <circle cx="4" cy="18" r="1" fill="currentColor"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                    className={`p-2 ${editor.isActive('heading', { level: 2 }) ? 'bg-neutral-200 dark:bg-neutral-700' : ''} text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors`}
                    title="제목"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h6M4 12h6M4 18h6M14 6v12M14 12h6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
                    className={`p-2 ${editor.isActive('heading', { level: 3 }) ? 'bg-neutral-200 dark:bg-neutral-700' : ''} text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors`}
                    title="소제목"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h7M4 12h7M4 17h7M14 7v10M14 12h6" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().toggleBlockquote().run()}
                    className={`p-2 ${editor.isActive('blockquote') ? 'bg-neutral-200 dark:bg-neutral-700' : ''} text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors`}
                    title="인용구"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().setHorizontalRule().run()}
                    className="p-2 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors"
                    title="구분선"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <line x1="4" y1="12" x2="20" y2="12" strokeWidth={2} strokeLinecap="round"/>
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().undo().run()}
                    className="p-2 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors"
                    title="되돌리기"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7H3v4" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 11a8 8 0 0113.657-5.657" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => editor.chain().focus().redo().run()}
                    className="p-2 text-neutral-700 dark:text-neutral-300 hover:bg-white dark:hover:bg-neutral-800 rounded transition-colors"
                    title="다시 실행"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7h4v4" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 11a8 8 0 00-13.657-5.657" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            <div>
              <div className={`
                border-2 ${errors.description ? 'border-red-400 dark:border-red-600' : 'border-neutral-300 dark:border-neutral-700'}
                rounded-xl
                bg-white dark:bg-neutral-950
                focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent
                transition-all
                tiptap-editor
              `}>
                <EditorContent editor={editor} />
              </div>
              {errors.description && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400 font-medium">
                  {errors.description}
                </p>
              )}
              <div className="mt-2 flex items-center justify-between">
                <p
                  className={`text-sm ${
                    descriptionLength < 15 || descriptionLength > 1000
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-neutral-500 dark:text-neutral-400'
                  }`}
                >
                  {descriptionLength} / 1000 자 (최소 15자)
                </p>
                <p className="text-xs text-neutral-400 dark:text-neutral-600">
                  💡 위 버튼으로 텍스트 꾸미기
                </p>
              </div>
            </div>
          </div>

            {/* 제출 버튼 */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isSubmitting}
                size="lg"
                className="flex-1 text-base sm:text-lg font-semibold"
              >
                취소
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                size="lg"
                className="flex-1 text-base sm:text-lg font-semibold bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg hover:shadow-xl"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span>
                    작성 중...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>✨</span>
                    게시글 작성
                  </span>
                )}
              </Button>
            </div>
          </form>

          <aside className="lg:sticky lg:top-24 h-fit space-y-4">
            <div className="p-4 rounded-2xl border-2 border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-neutral-600 dark:text-neutral-400">
                  작성 진행률
                </h3>
                <span className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
                  {completedCount}/{requiredCount}
                </span>
              </div>
              <div className="h-2 rounded-full bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="group block rounded-3xl bg-white dark:bg-neutral-900 overflow-hidden shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 ring-1 ring-transparent hover:ring-primary-500/60">
              <div className="relative aspect-square bg-neutral-100 dark:bg-neutral-800 overflow-hidden">
                {representativePreview ? (
                  <>
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 scale-110 opacity-60 blur-2xl"
                      style={{
                        backgroundImage: `url(${representativePreview})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20"
                    />
                    <img
                      src={representativePreview}
                      alt="대표 이미지 미리보기"
                      className="absolute inset-0 w-full h-full object-contain object-center transition-transform duration-300"
                    />
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-neutral-400">
                    대표 이미지
                  </div>
                )}
                {region && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="px-3 py-1.5 rounded-full text-xs font-semibold bg-primary-600/90 text-white backdrop-blur-sm shadow-lg">
                      {regionLabels[region as Region]}
                    </span>
                  </div>
                )}
                <div className="absolute top-4 right-4 z-10">
                  <span
                    className={`px-4 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${STATUS_COLORS[GearStatus.Selling]}`}
                  >
                    {STATUS_LABELS[GearStatus.Selling]}
                  </span>
                </div>
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />
                <div className="absolute bottom-3 right-4 z-10">
                  <div className="inline-flex items-baseline gap-1 rounded-full bg-black/55 px-3 py-1.5 text-white shadow-lg ring-1 ring-white/15">
                    {displayPrice ? (
                      <>
                        <span className="text-xl font-extrabold tracking-tight">
                          {displayPrice}
                        </span>
                        <span className="text-xs font-semibold text-white/80">원</span>
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-white/80">가격 입력</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-2">
                <div className="text-[11px] font-semibold text-primary-600 dark:text-primary-400 uppercase tracking-wider">
                  {topCategory
                    ? topCategory === 'etc'
                      ? TOP_CATEGORY_LABELS[topCategory]
                      : [
                          TOP_CATEGORY_LABELS[topCategory],
                          category ? MID_CATEGORY_LABELS[category] : null,
                          subCategory ? DETAIL_CATEGORY_LABELS[subCategory] : null,
                        ]
                          .filter(Boolean)
                          .join(' > ')
                    : '카테고리 선택'}
                </div>

                <h3
                  className="text-base font-bold text-foreground line-clamp-2 leading-snug"
                  title={title.trim() || '제목이 여기에 표시됩니다'}
                >
                  {title.trim() || '제목이 여기에 표시됩니다'}
                </h3>

                <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                  <span className="font-semibold text-primary-700 dark:text-primary-300">
                    {previewAuthor}
                  </span>
                  <span>방금 전</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
      {dragState && dragIndex !== null && images[dragIndex] && (
        <div
          className="fixed z-40 pointer-events-none"
          style={{
            left: dragState.x - dragState.offsetX,
            top: dragState.y - dragState.offsetY,
            width: dragState.width,
            height: dragState.height,
          }}
        >
          <div className="rounded-xl overflow-hidden shadow-2xl ring-2 ring-primary-500 bg-white dark:bg-neutral-900">
            <img
              src={images[dragIndex].preview}
              alt="드래그 중인 이미지"
              className="w-full h-full object-contain bg-neutral-100 dark:bg-neutral-900"
            />
          </div>
        </div>
      )}
      {zoomImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center"
          onClick={() => setZoomImage(null)}
        >
          <div
            className="w-full h-full flex items-center justify-center"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="relative inline-block">
              <img
                src={zoomImage}
                alt="이미지 미리보기"
                className="max-w-[100vw] max-h-[90vh] object-contain"
              />
              <button
                type="button"
                onClick={() => setZoomImage(null)}
                className="absolute top-3 right-3 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center"
                title="닫기"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
