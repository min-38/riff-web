// 악기 거래 게시글 타입 정의

export type InstrumentCategory = 'guitar' | 'bass' | 'drum' | 'keyboard' | 'wind' | 'string' | 'effects' | 'etc';

export type InstrumentSubCategory =
  | 'acoustic' | 'electric' | 'classical' // guitar
  | 'electric_bass' | 'acoustic_bass' | 'upright_bass' // bass
  | 'acoustic_drum' | 'electronic_drum' | 'percussion' // drum
  | 'piano' | 'synthesizer' | 'midi' | 'organ' // keyboard
  | 'saxophone' | 'trumpet' | 'flute' | 'clarinet' // wind
  | 'violin' | 'viola' | 'cello' // string
  | 'multi_effects' | 'pedal' | 'amp' | 'preamp' // effects
  | 'accessory' | 'other'; // etc

export type InstrumentStatus = 'selling' | 'reserved' | 'sold';
export type InstrumentCondition = 'new' | 'like_new' | 'good' | 'fair';
export type TradeMethod = 'direct' | 'delivery' | 'both';

export interface Instrument {
  id: string;
  title: string;
  price: number;
  category: InstrumentCategory;
  subCategory: InstrumentSubCategory;
  condition?: InstrumentCondition;
  tradeMethod: TradeMethod;
  region?: string;
  description: string;
  status: InstrumentStatus;
  images: string[];
  viewCount: number;
  likeCount: number;
  chatCount: number;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    nickname: string;
    avatar?: string;
  };
}

// 카테고리 한글 매핑
export const CATEGORY_LABELS: Record<InstrumentCategory, string> = {
  guitar: '기타',
  bass: '베이스',
  drum: '드럼',
  keyboard: '건반',
  wind: '관악기',
  string: '현악기',
  effects: '이펙터',
  etc: '기타',
};

// 서브카테고리 한글 매핑
export const SUB_CATEGORY_LABELS: Record<InstrumentSubCategory, string> = {
  // 기타
  acoustic: '통기타',
  electric: '일렉기타',
  classical: '클래식기타',
  // 베이스
  electric_bass: '일렉베이스',
  acoustic_bass: '어쿠스틱베이스',
  upright_bass: '더블베이스',
  // 드럼
  acoustic_drum: '어쿠스틱드럼',
  electronic_drum: '전자드럼',
  percussion: '퍼커션',
  // 건반
  piano: '피아노',
  synthesizer: '신디사이저',
  midi: 'MIDI',
  organ: '오르간',
  // 관악기
  saxophone: '색소폰',
  trumpet: '트럼펫',
  flute: '플루트',
  clarinet: '클라리넷',
  // 현악기
  violin: '바이올린',
  viola: '비올라',
  cello: '첼로',
  // 이펙터
  multi_effects: '멀티이펙터',
  pedal: '페달',
  amp: '앰프',
  preamp: '프리앰프',
  // 기타
  accessory: '악세서리',
  other: '기타',
};

// 카테고리별 서브카테고리 매핑
export const CATEGORY_SUB_MAPPING: Record<InstrumentCategory, InstrumentSubCategory[]> = {
  guitar: ['acoustic', 'electric', 'classical'],
  bass: ['electric_bass', 'acoustic_bass', 'upright_bass'],
  drum: ['acoustic_drum', 'electronic_drum', 'percussion'],
  keyboard: ['piano', 'synthesizer', 'midi', 'organ'],
  wind: ['saxophone', 'trumpet', 'flute', 'clarinet'],
  string: ['violin', 'viola', 'cello'],
  effects: ['multi_effects', 'pedal', 'amp', 'preamp'],
  etc: ['accessory', 'other'],
};

// 상태 한글 매핑
export const STATUS_LABELS: Record<InstrumentStatus, string> = {
  selling: '판매중',
  reserved: '예약중',
  sold: '거래완료',
};

// 상태별 색상
export const STATUS_COLORS: Record<InstrumentStatus, string> = {
  selling: 'bg-emerald-500/90 text-white',
  reserved: 'bg-amber-500/90 text-white',
  sold: 'bg-neutral-500/90 text-white',
};

// 상태 한글 매핑
export const CONDITION_LABELS: Record<InstrumentCondition, string> = {
  new: '새제품',
  like_new: '거의 새것',
  good: '좋음',
  fair: '사용감 있음',
};

// 거래방법 한글 매핑
export const TRADE_METHOD_LABELS: Record<TradeMethod, string> = {
  direct: '직거래',
  delivery: '택배',
  both: '직거래, 택배',
};

// 지역 목록 (대한민국 시/도)
export const REGIONS = [
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '광주',
  '대전',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
] as const;
