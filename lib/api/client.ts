import type { ApiError } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw {
          message: '서버와의 통신에 실패했습니다. 잠시 후 다시 시도해주세요.',
          status: response.status,
        } as ApiError;
      }

      // 에러 응답 처리
      if (!response.ok) {
        const error: ApiError = {
          ...data,
          message: data.message || '오류가 발생했습니다',
          errors: data.errors,
          status: response.status,
        };
        throw error;
      }

      return data as T;
    } catch (error) {
      // Re-throw API errors
      if ((error as ApiError).message) {
        throw error;
      }

      throw {
        message: '네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.',
        status: 0,
      } as ApiError;
    }
  }

  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'GET',
    });
  }

  async post<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
