import { apiClient } from './client';
import type {
  CheckEmailRequest,
  CheckEmailResponse,
  RegisterRequest,
  RegisterResponse,
  ResendVerificationRequest,
  ResendVerificationResponse,
  GetVerificationInfoRequest,
  GetVerificationInfoResponse,
  VerifyEmailByTokenResponse,
  LoginWithTokenRequest,
  LoginWithTokenResponse,
  AuthResponse,
  CheckNicknameResponse,
} from './types';

export const authApi = {
  /**
   * 이메일 중복 확인
   */
  checkEmail: async (data: CheckEmailRequest): Promise<CheckEmailResponse> => {
    return apiClient.post<CheckEmailResponse>('/auth/check-email', data);
  },

  /**
   * 닉네임 중복 확인
   */
  checkNickname: async (nickname: string): Promise<CheckNicknameResponse> => {
    return apiClient.post<CheckNicknameResponse>('/auth/check-nickname', {
      nickname,
    });
  },

  /**
   * 회원가입 (약관 동의 후)
   */
  register: async (data: RegisterRequest): Promise<RegisterResponse> => {
    return apiClient.post<RegisterResponse>('/auth/register', data);
  },

  /**
   * 인증 정보 조회 (토큰 기반)
   */
  getVerificationInfo: async (
    data: GetVerificationInfoRequest
  ): Promise<GetVerificationInfoResponse> => {
    return apiClient.post<GetVerificationInfoResponse>(
      '/auth/verification-info',
      data
    );
  },

  /**
   * 인증 메일 재전송 (토큰 기반)
   */
  resendVerification: async (
    data: ResendVerificationRequest
  ): Promise<ResendVerificationResponse> => {
    return apiClient.post<ResendVerificationResponse>(
      '/auth/resend-verification',
      data
    );
  },

  /**
   * 이메일 인증 (토큰 기반)
   */
  verifyEmailByToken: async (
    token: string
  ): Promise<VerifyEmailByTokenResponse> => {
    return apiClient.get<VerifyEmailByTokenResponse>(
      `/auth/verify-email?token=${token}`
    );
  },

  /**
   * 자동 로그인 (토큰 기반)
   */
  loginWithToken: async (
    data: LoginWithTokenRequest
  ): Promise<LoginWithTokenResponse> => {
    return apiClient.post<LoginWithTokenResponse>(
      '/auth/login-with-token',
      data
    );
  },

  /**
   * 로그인
   */
  login: async (data: {
    email: string;
    password: string;
  }): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/login', data);
  },

  /**
   * 로그아웃
   */
  logout: async (refreshToken?: string): Promise<{ message: string }> => {
    return apiClient.post<{ message: string }>('/auth/logout', {
      refreshToken,
    });
  },

  /**
   * 토큰 갱신
   */
  refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
    return apiClient.post<AuthResponse>('/auth/refresh', { refreshToken });
  },
};
