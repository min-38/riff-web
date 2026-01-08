import { apiClient } from './client';
import { getAccessToken } from '../auth/token';
import type {
  CreateGearRequest,
  UpdateGearRequest,
  GetGearsRequest,
  GearResponse,
  GearListResponse,
} from './types';

/************************
 * 
 * FormData 생성 헬퍼 함수
 * 
 ************************/

function createGearFormData(
  data: CreateGearRequest | UpdateGearRequest,
  images?: File[]
): FormData {
  const formData = new FormData();

  // 기본 필드 추가
  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      if (Array.isArray(value)) {
        // keepImageUrls 같은 배열 필드 처리
        value.forEach((item) => {
          formData.append(key, item);
        });
      } else {
        formData.append(key, String(value));
      }
    }
  });

  // 이미지 파일 추가
  if (images && images.length > 0) {
    images.forEach((image) => {
      formData.append('images', image);
    });
  }

  return formData;
}

// 인증 헤더 생성
function getAuthHeaders(): HeadersInit {
  const token = getAccessToken();
  if (!token) {
    throw new Error('로그인이 필요합니다.');
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

export const tradeGearApi = {
  // 판매글 작성
  createGear: async (
    data: CreateGearRequest,
    images?: File[]
  ): Promise<GearResponse> => {
    const formData = createGearFormData(data, images);
    return apiClient.postFormData<GearResponse>('/trade/gears', formData, {
      headers: getAuthHeaders(),
    });
  },

  // 판매글 목록 조회
  getGears: async (params?: GetGearsRequest): Promise<GearListResponse> => {
    // 쿼리 파라미터 생성
    const queryParams = new URLSearchParams();

    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }

    const queryString = queryParams.toString();
    const endpoint = queryString
      ? `/trade/gears?${queryString}`
      : '/trade/gears';

    return apiClient.get<GearListResponse>(endpoint);
  },

  // 판매글 상세 조회
  getGearById: async (id: number): Promise<GearResponse> => {
    // 로그인 상태면 토큰 포함, 아니면 없이 조회
    const token = getAccessToken();
    const options = token ? { headers: { Authorization: `Bearer ${token}` } } : undefined;

    return apiClient.get<GearResponse>(`/trade/gears/${id}`, options);
  },

  // 판매글 수정
  updateGear: async (
    id: number,
    data: UpdateGearRequest,
    images?: File[]
  ): Promise<GearResponse> => {
    const formData = createGearFormData(data, images);
    return apiClient.patchFormData<GearResponse>(
      `/trade/gears/${id}`,
      formData,
      {
        headers: getAuthHeaders(),
      }
    );
  },

  // 판매글 삭제
  deleteGear: async (id: number): Promise<void> => {
    return apiClient.delete<void>(`/trade/gears/${id}`, {
      headers: getAuthHeaders(),
    });
  },
};
