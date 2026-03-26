// src/lib/api.ts
// 클라이언트에서 서버 API를 호출하는 함수 모음

import {
  SignupRequest,
  LoginRequest,
  AuthResponse,
  Course,
  Lecture,
  Progress,
  ProgressSaveRequest,
} from '@/types';

// 🔥 Express 서버 주소로 변경
const BASE_URL = 'http://localhost:5000/api';

// 저장된 토큰 가져오기
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// 공통 fetch 래퍼 (🔥 단순화)
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token } : {}), // 🔥 Bearer 제거 (백엔드 맞춤)
    ...options.headers,
  };

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.message || '요청 실패');
  }

  return json;
}

// ─── 인증 API ────────────────────────────────────────────────

export const authApi = {
  signup: (data: SignupRequest) =>
    apiFetch<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  login: (data: LoginRequest) =>
    apiFetch<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};

// ─── 강의 API ────────────────────────────────────────────────

export const courseApi = {
  // 강의 목록 조회
  getAll: () => apiFetch<Course[]>('/courses'),

  // 강의 상세 조회
  getById: (id: number) => apiFetch<Course>(`/courses/${id}`),

  // 강의의 영상 목록 조회
  getLectures: (courseId: number) =>
    apiFetch<Lecture[]>(`/lectures/${courseId}`),
};

// ─── 강의 영상 API ───────────────────────────────────────────

export const lectureApi = {
  getById: (id: number) => apiFetch<Lecture>(`/lectures/${id}`),
};

// ─── 진도 API ────────────────────────────────────────────────

export const progressApi = {
  // 진도 저장
  save: (data: ProgressSaveRequest) =>
    apiFetch<Progress>('/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 내 진도 조회
  getByUser: (userId: number) =>
    apiFetch<Progress[]>(`/progress/${userId}`),
};
