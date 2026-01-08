import {
  GearCategory,
  GearSubCategory,
  GearCondition,
  GearStatus,
  TradeMethod,
  Region,
} from '@/lib/api/types';

export const CATEGORY_LABELS: Record<GearCategory, string> = {
  [GearCategory.Instrument]: '악기',
  [GearCategory.Audio]: '음향',
  [GearCategory.Accessory]: '악세서리',
  [GearCategory.Etc]: '기타',
};

export const TOP_CATEGORY_LABELS = {
  instrument: '악기',
  audio: '음향',
  accessory: '악세서리',
  etc: '기타',
} as const;

export type TopCategoryKey = keyof typeof TOP_CATEGORY_LABELS;

export const MID_CATEGORY_LABELS = {
  guitar: '기타',
  bass: '베이스',
  drum: '드럼',
  keyboard: '건반',
  wind: '관악',
  string_instrument: '현악',
  effects: '이펙터',
  mixer: '믹서',
  amp: '앰프',
  speaker: '스피커',
  monitor: '모니터',
  audio_interface: '오디오인터페이스',
  microphone: '마이크',
  headphone: '헤드폰/헤드셋',
  iem: '인이어',
  earphone: '이어폰',
  cable: '케이블',
  stand: '스탠드',
  case: '케이스',
  pick: '피크',
  string_accessory: '줄(현)',
  drumstick: '드럼스틱',
  other: '기타',
} as const;

export type MidCategoryKey = keyof typeof MID_CATEGORY_LABELS;

export const DETAIL_CATEGORY_LABELS = {
  electric: '일렉기타',
  acoustic: '어쿠스틱기타',
  classical: '클래식기타',
  electric_bass: '일렉베이스',
  acoustic_bass: '어쿠스틱베이스',
  upright_bass: '콘트라베이스',
  acoustic_drum: '어쿠스틱드럼',
  electronic_drum: '전자드럼',
  percussion: '퍼커션',
  piano: '피아노',
  synthesizer: '신디사이저',
  midi: 'MIDI',
  organ: '오르간',
  saxophone: '색소폰',
  trumpet: '트럼펫',
  flute: '플루트',
  clarinet: '클라리넷',
  violin: '바이올린',
  viola: '비올라',
  cello: '첼로',
  multi_effects: '멀티이펙터',
  pedal: '페달',
  bass_effects: '베이스 이펙터',
  acoustic_effects: '어쿠스틱 이펙터',
  pedalboard: '페달보드',
  power_supply: '파워서플라이',
  effects_other: '기타',
  mixer: '믹서',
  amp: '앰프',
  preamp: '프리앰프',
  power_amp: '파워앰프',
  pa_speaker: 'PA 스피커',
  subwoofer: '서브우퍼',
  speaker_system: '스피커 시스템',
  monitor: '모니터 스피커',
  studio_monitor: '스튜디오 모니터',
  usb_interface: 'USB 오디오인터페이스',
  thunderbolt_interface: '썬더볼트 오디오인터페이스',
  pcie_interface: 'PCIe 오디오인터페이스',
  condenser: '콘덴서 마이크',
  dynamic: '다이내믹 마이크',
  ribbon: '리본 마이크',
  wireless_mic: '무선 마이크',
  headphone: '헤드폰',
  headset: '헤드셋',
  iem: '인이어',
  earphone: '이어폰',
  instrument_cable: '악기 케이블',
  mic_cable: '마이크 케이블',
  speaker_cable: '스피커 케이블',
  patch_cable: '패치 케이블',
  stand: '스탠드',
  case: '케이스',
  pick: '피크',
  string: '줄(현)',
  drumstick: '드럼스틱',
  other: '기타',
} as const;

export type DetailCategoryKey = keyof typeof DETAIL_CATEGORY_LABELS;

export const TOP_CATEGORY_MID_MAPPING: Record<TopCategoryKey, MidCategoryKey[]> = {
  instrument: [
    'guitar',
    'bass',
    'drum',
    'keyboard',
    'wind',
    'string_instrument',
  ],
  audio: [
    'effects',
    'mixer',
    'amp',
    'speaker',
    'monitor',
    'audio_interface',
    'microphone',
    'headphone',
    'iem',
    'earphone',
  ],
  accessory: [
    'cable',
    'stand',
    'case',
    'pick',
    'string_accessory',
    'drumstick',
  ],
  etc: ['other'],
};

export const MID_DETAIL_MAPPING: Record<MidCategoryKey, DetailCategoryKey[]> = {
  guitar: ['electric', 'acoustic', 'classical'],
  bass: ['electric_bass', 'acoustic_bass', 'upright_bass'],
  drum: ['acoustic_drum', 'electronic_drum', 'percussion'],
  keyboard: ['piano', 'synthesizer', 'midi', 'organ'],
  wind: ['saxophone', 'trumpet', 'flute', 'clarinet'],
  string_instrument: ['violin', 'viola', 'cello'],
  effects: [
    'multi_effects',
    'pedal',
    'bass_effects',
    'acoustic_effects',
    'pedalboard',
    'power_supply',
    'effects_other',
  ],
  mixer: ['mixer'],
  amp: ['amp', 'preamp', 'power_amp'],
  speaker: ['pa_speaker', 'subwoofer', 'speaker_system'],
  monitor: ['monitor', 'studio_monitor'],
  audio_interface: ['usb_interface', 'thunderbolt_interface', 'pcie_interface'],
  microphone: ['condenser', 'dynamic', 'ribbon', 'wireless_mic'],
  headphone: ['headphone', 'headset'],
  iem: ['iem'],
  earphone: ['earphone'],
  cable: ['instrument_cable', 'mic_cable', 'speaker_cable', 'patch_cable'],
  stand: ['stand'],
  case: ['case'],
  pick: ['pick'],
  string_accessory: ['string'],
  drumstick: ['drumstick'],
  other: ['other'],
};

export const TOP_CATEGORY_ORDER: TopCategoryKey[] = [
  'instrument',
  'audio',
  'accessory',
  'etc',
];

export const MID_CATEGORY_ORDER: MidCategoryKey[] = Object.keys(
  MID_CATEGORY_LABELS
) as MidCategoryKey[];

export const DETAIL_CATEGORY_ORDER: DetailCategoryKey[] = Object.keys(
  DETAIL_CATEGORY_LABELS
) as DetailCategoryKey[];

export const CATEGORY_PARENT_MAP: Record<GearCategory, TopCategoryKey> = {
  [GearCategory.Instrument]: 'instrument',
  [GearCategory.Audio]: 'audio',
  [GearCategory.Accessory]: 'accessory',
  [GearCategory.Etc]: 'etc',
};

export const CATEGORY_LABELS_WITH_ICON: Record<GearCategory, string> = {
  [GearCategory.Instrument]: '🎸 악기',
  [GearCategory.Audio]: '🎛️ 음향',
  [GearCategory.Accessory]: '🧰 악세서리',
  [GearCategory.Etc]: '🎵 기타',
};

export const SUB_CATEGORY_LABELS: Record<GearSubCategory, string> = {
  [GearSubCategory.Guitar]: '기타',
  [GearSubCategory.Bass]: '베이스',
  [GearSubCategory.Drum]: '드럼',
  [GearSubCategory.Keyboard]: '건반',
  [GearSubCategory.Wind]: '관악',
  [GearSubCategory.StringInstrument]: '현악',
  [GearSubCategory.Effects]: '이펙터',
  [GearSubCategory.Mixer]: '믹서',
  [GearSubCategory.Amp]: '앰프',
  [GearSubCategory.Speaker]: '스피커',
  [GearSubCategory.Monitor]: '모니터',
  [GearSubCategory.AudioInterface]: '오디오인터페이스',
  [GearSubCategory.Microphone]: '마이크',
  [GearSubCategory.Headphone]: '헤드폰/헤드셋',
  [GearSubCategory.Iem]: '인이어',
  [GearSubCategory.Earphone]: '이어폰',
  [GearSubCategory.Cable]: '케이블',
  [GearSubCategory.Stand]: '스탠드',
  [GearSubCategory.Case]: '케이스',
  [GearSubCategory.Pick]: '피크',
  [GearSubCategory.StringAccessory]: '줄(현)',
  [GearSubCategory.Drumstick]: '드럼스틱',
  [GearSubCategory.Other]: '기타',
};

export const CATEGORY_SUB_MAPPING: Record<GearCategory, GearSubCategory[]> = {
  [GearCategory.Instrument]: [
    GearSubCategory.Guitar,
    GearSubCategory.Bass,
    GearSubCategory.Drum,
    GearSubCategory.Keyboard,
    GearSubCategory.Wind,
    GearSubCategory.StringInstrument,
  ],
  [GearCategory.Audio]: [
    GearSubCategory.Effects,
    GearSubCategory.Mixer,
    GearSubCategory.Amp,
    GearSubCategory.Speaker,
    GearSubCategory.Monitor,
    GearSubCategory.AudioInterface,
    GearSubCategory.Microphone,
    GearSubCategory.Headphone,
    GearSubCategory.Iem,
    GearSubCategory.Earphone,
  ],
  [GearCategory.Accessory]: [
    GearSubCategory.Cable,
    GearSubCategory.Stand,
    GearSubCategory.Case,
    GearSubCategory.Pick,
    GearSubCategory.StringAccessory,
    GearSubCategory.Drumstick,
  ],
  [GearCategory.Etc]: [GearSubCategory.Other],
};

export const STATUS_LABELS: Record<GearStatus, string> = {
  [GearStatus.Selling]: '판매중',
  [GearStatus.Reserved]: '예약중',
  [GearStatus.Sold]: '거래완료',
};

export const STATUS_COLORS: Record<GearStatus, string> = {
  [GearStatus.Selling]: 'bg-emerald-500/90 text-white',
  [GearStatus.Reserved]: 'bg-amber-500/90 text-white',
  [GearStatus.Sold]: 'bg-neutral-500/90 text-white',
};

export const CONDITION_LABELS: Record<GearCondition, string> = {
  [GearCondition.New]: '✨ 새 제품',
  [GearCondition.LikeNew]: '⭐ 거의 새 것',
  [GearCondition.Good]: '👍 좋음',
  [GearCondition.Fair]: '👌 보통',
};

export const CONDITION_ORDER: GearCondition[] = [
  GearCondition.New,
  GearCondition.LikeNew,
  GearCondition.Good,
  GearCondition.Fair,
];

export const TRADE_METHOD_LABELS: Record<TradeMethod, string> = {
  [TradeMethod.Direct]: '직거래',
  [TradeMethod.Delivery]: '택배',
  [TradeMethod.Both]: '직거래, 택배',
};

export const TRADE_METHOD_ORDER: TradeMethod[] = [
  TradeMethod.Direct,
  TradeMethod.Delivery,
  TradeMethod.Both,
];

export const REGION_LABELS: Record<Region, string> = {
  [Region.Seoul]: '서울',
  [Region.Busan]: '부산',
  [Region.Daegu]: '대구',
  [Region.Incheon]: '인천',
  [Region.Gwangju]: '광주',
  [Region.Daejeon]: '대전',
  [Region.Ulsan]: '울산',
  [Region.Sejong]: '세종',
  [Region.Gyeonggi]: '경기',
  [Region.Gangwon]: '강원',
  [Region.Chungbuk]: '충북',
  [Region.Chungnam]: '충남',
  [Region.Jeonbuk]: '전북',
  [Region.Jeonnam]: '전남',
  [Region.Gyeongbuk]: '경북',
  [Region.Gyeongnam]: '경남',
  [Region.Jeju]: '제주',
};

export const REGIONS = Object.values(Region);

export const GEAR_CATEGORY_ORDER: GearCategory[] = [
  GearCategory.Instrument,
  GearCategory.Audio,
  GearCategory.Accessory,
  GearCategory.Etc,
];

export const GEAR_SUBCATEGORY_ORDER: GearSubCategory[] = [
  GearSubCategory.Guitar,
  GearSubCategory.Bass,
  GearSubCategory.Drum,
  GearSubCategory.Keyboard,
  GearSubCategory.Wind,
  GearSubCategory.StringInstrument,
  GearSubCategory.Effects,
  GearSubCategory.Mixer,
  GearSubCategory.Amp,
  GearSubCategory.Speaker,
  GearSubCategory.Monitor,
  GearSubCategory.AudioInterface,
  GearSubCategory.Microphone,
  GearSubCategory.Headphone,
  GearSubCategory.Iem,
  GearSubCategory.Earphone,
  GearSubCategory.Cable,
  GearSubCategory.Stand,
  GearSubCategory.Case,
  GearSubCategory.Pick,
  GearSubCategory.StringAccessory,
  GearSubCategory.Drumstick,
  GearSubCategory.Other,
];

export const GEAR_STATUS_ORDER: GearStatus[] = [
  GearStatus.Selling,
  GearStatus.Reserved,
  GearStatus.Sold,
];

export const REGION_ORDER: Region[] = [
  Region.Seoul,
  Region.Busan,
  Region.Daegu,
  Region.Incheon,
  Region.Gwangju,
  Region.Daejeon,
  Region.Ulsan,
  Region.Sejong,
  Region.Gyeonggi,
  Region.Gangwon,
  Region.Chungbuk,
  Region.Chungnam,
  Region.Jeonbuk,
  Region.Jeonnam,
  Region.Gyeongbuk,
  Region.Gyeongnam,
  Region.Jeju,
];
