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

// Error Response
export interface ApiError {
  message: string;
  errors?: string[];
  status?: number;
}
