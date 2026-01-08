// API 응답 및 요청 타입 정의
export interface ApiResponse<T = any> {
  message?: string;
  errors?: string[];
  data?: T;
}

export interface AuthResponse {
  userId: string;
  email: string;
  token?: string;
  nickname: string;
  verified: boolean;
  refreshToken?: string;
  expiresAt?: string;
}

export interface CheckEmailRequest {
  email: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  passwordConfirm: string;
  nickname: string;
  termsOfServiceAgreed: boolean;
  privacyPolicyAgreed: boolean;
  marketingAgreed: boolean;
}

export interface ResendVerificationRequest {
  verificationToken: string;
  captchaToken?: string;
}

export interface GetVerificationInfoRequest {
  verificationToken: string;
}

export interface LoginWithTokenRequest {
  autoLoginToken: string;
}

export interface CheckEmailResponse {
  available: boolean;
  message: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  message: string;
  verificationToken?: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export interface GetVerificationInfoResponse {
  email: string;
  sentAt?: string;
  remainingCooldown?: number;
}

export interface VerifyEmailByTokenResponse {
  verified: boolean;
  message: string;
  autoLoginToken?: string;
  redirectUrl?: string;
}

export interface LoginWithTokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    nickname: string;
  };
}

export interface CheckNicknameResponse {
  available: boolean;
}

// Password Reset Types
export interface ForgotPasswordRequest {
  email: string;
  captchaToken?: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface VerifyResetTokenRequest {
  token: string;
}

export interface VerifyResetTokenResponse {
  success: boolean;
  message: string;
  email?: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// Error Response
export interface ApiError {
  message: string;
  errors?: string[];
  status?: number;
  verified?: boolean;
  verificationToken?: string;
  remainingCooldown?: number;
  retryAfter?: number;
  [key: string]: any;
}

// TradeGear Enums
export enum GearCategory {
  Instrument = "instrument",
  Audio = "audio",
  Accessory = "accessory",
  Etc = "etc",
}

export enum GearSubCategory {
  Guitar = "guitar",
  Bass = "bass",
  Drum = "drum",
  Keyboard = "keyboard",
  Wind = "wind",
  StringInstrument = "string_instrument",
  Effects = "effects",
  Mixer = "mixer",
  Amp = "amp",
  Speaker = "speaker",
  Monitor = "monitor",
  AudioInterface = "audio_interface",
  Microphone = "microphone",
  Headphone = "headphone",
  Iem = "iem",
  Earphone = "earphone",
  Cable = "cable",
  Stand = "stand",
  Case = "case",
  Pick = "pick",
  StringAccessory = "string_accessory",
  Drumstick = "drumstick",
  Other = "other",
}

export enum GearDetailCategory {
  Electric = "electric",
  Acoustic = "acoustic",
  Classical = "classical",
  ElectricBass = "electric_bass",
  AcousticBass = "acoustic_bass",
  UprightBass = "upright_bass",
  AcousticDrum = "acoustic_drum",
  ElectronicDrum = "electronic_drum",
  Percussion = "percussion",
  Piano = "piano",
  Synthesizer = "synthesizer",
  Midi = "midi",
  Organ = "organ",
  Saxophone = "saxophone",
  Trumpet = "trumpet",
  Flute = "flute",
  Clarinet = "clarinet",
  Violin = "violin",
  Viola = "viola",
  Cello = "cello",
  MultiEffects = "multi_effects",
  Pedal = "pedal",
  BassEffects = "bass_effects",
  AcousticEffects = "acoustic_effects",
  Pedalboard = "pedalboard",
  PowerSupply = "power_supply",
  EffectsOther = "effects_other",
  Mixer = "mixer",
  Amp = "amp",
  Preamp = "preamp",
  PowerAmp = "power_amp",
  PaSpeaker = "pa_speaker",
  Subwoofer = "subwoofer",
  SpeakerSystem = "speaker_system",
  Monitor = "monitor",
  StudioMonitor = "studio_monitor",
  UsbInterface = "usb_interface",
  ThunderboltInterface = "thunderbolt_interface",
  PcieInterface = "pcie_interface",
  Condenser = "condenser",
  Dynamic = "dynamic",
  Ribbon = "ribbon",
  WirelessMic = "wireless_mic",
  Headphone = "headphone",
  Headset = "headset",
  Iem = "iem",
  Earphone = "earphone",
  InstrumentCable = "instrument_cable",
  MicCable = "mic_cable",
  SpeakerCable = "speaker_cable",
  PatchCable = "patch_cable",
  Stand = "stand",
  Case = "case",
  Pick = "pick",
  String = "string",
  Drumstick = "drumstick",
  Other = "other",
}

export enum GearCondition {
  New = "New",
  LikeNew = "LikeNew",
  Good = "Good",
  Fair = "Fair",
}

export enum GearStatus {
  Selling = "Selling",
  Reserved = "Reserved",
  Sold = "Sold",
}

export enum TradeMethod {
  Direct = "Direct",
  Delivery = "Delivery",
  Both = "Both",
}

export enum Region {
  Seoul = "Seoul",
  Gyeonggi = "Gyeonggi",
  Incheon = "Incheon",
  Busan = "Busan",
  Daegu = "Daegu",
  Gwangju = "Gwangju",
  Daejeon = "Daejeon",
  Ulsan = "Ulsan",
  Sejong = "Sejong",
  Gangwon = "Gangwon",
  Chungbuk = "Chungbuk",
  Chungnam = "Chungnam",
  Jeonbuk = "Jeonbuk",
  Jeonnam = "Jeonnam",
  Gyeongbuk = "Gyeongbuk",
  Gyeongnam = "Gyeongnam",
  Jeju = "Jeju",
}

// TradeGear Types
export interface ImageData {
  count: number;
  urls: string[];
  public_base_url?: string;
  mainIndex?: number;
}

export interface CreateGearRequest {
  title: string;
  description: string;
  price: number;
  category: GearCategory;
  subCategory: GearSubCategory;
  detailCategory?: GearDetailCategory;
  condition?: GearCondition;
  tradeMethod: TradeMethod;
  region: Region;
  mainImageIndex?: number;
}

export interface UpdateGearRequest {
  title?: string;
  description?: string;
  price?: number;
  category?: GearCategory;
  subCategory?: GearSubCategory;
  detailCategory?: GearDetailCategory;
  condition?: GearCondition;
  tradeMethod?: TradeMethod;
  region?: Region;
  status?: GearStatus;
  keepImageUrls?: string[];
  mainImageIndex?: number;
}

export interface GetGearsRequest {
  page?: number;
  pageSize?: number;
  category?: GearCategory;
  subCategory?: GearSubCategory;
  detailCategory?: GearDetailCategory;
  status?: GearStatus;
  condition?: GearCondition;
  tradeMethod?: TradeMethod;
  region?: Region;
  minPrice?: number;
  maxPrice?: number;
  searchKeyword?: string;
  searchScope?: string;
  sortBy?: "created_at" | "price" | "view_count";
  sortOrder?: "asc" | "desc";
}

export interface GearResponse {
  id: number;
  title: string;
  description: string;
  price: number;
  category: GearCategory;
  subCategory: GearSubCategory;
  detailCategory?: GearDetailCategory;
  condition?: GearCondition;
  tradeMethod: TradeMethod;
  region: Region;
  status: GearStatus;
  images?: ImageData;
  viewCount: number;
  likeCount: number;
  chatCount: number;
  authorId: string;
  authorNickname: string;
  authorRating: number;
  isLiked?: boolean;
  isAuthor?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GearListResponse {
  gears: GearResponse[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
