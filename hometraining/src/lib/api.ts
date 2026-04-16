// src/lib/api.ts
// 클라이언트에서 서버 API를 호출하는 함수 모음

import {
  SignupRequest,
  LoginRequest,
  AuthResponse,
  Course,
  CourseCreateRequest,
  Lecture,
  LectureCreateRequest,
  Progress,
  ProgressSaveRequest,
  Comment,
  Reply,
  User,
  AdminStats,
} from '@/types';

// 🔥 Express 서버 주소로 변경
const BASE_URL = 'http://localhost:5000/api';

// 저장된 토큰 가져오기
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

// 공통 fetch 래퍼
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token } : {}),
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
  getAll: () => apiFetch<Course[]>('/courses'),
  getById: (id: number) => apiFetch<Course>(`/courses/${id}`),
  getLectures: (courseId: number) =>
    apiFetch<Lecture[]>(`/lectures/${courseId}`),
};

// ─── 강의 영상 API ───────────────────────────────────────────

export const lectureApi = {
  getById: (id: number) => apiFetch<Lecture>(`/lectures/${id}`),
};

// ─── 진도 API ────────────────────────────────────────────────

export const progressApi = {
  save: (data: ProgressSaveRequest) =>
    apiFetch<Progress>('/progress', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  getByUser: (userId: number) =>
    apiFetch<Progress[]>(`/progress/${userId}`),
};

// ─── 관리자 API ──────────────────────────────────────────────

export const adminApi = {
  // 전체 유저 목록 조회
  getUsers: () => apiFetch<Omit<User, 'password'>[]>('/admin/users'),

  // 유저 역할 변경
  updateUserRole: (userId: number, role: string) =>
    apiFetch<{ message: string }>(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  // 통계 조회
  getStats: () => apiFetch<AdminStats>('/admin/stats'),
};

// ─── 강사 API ────────────────────────────────────────────────

export const instructorApi = {
  // 강의(Course) 관리
  getMyCourses: () => apiFetch<Course[]>('/instructor/courses'),

  createCourse: (data: CourseCreateRequest) =>
    apiFetch<{ message: string; courseId: number }>('/instructor/courses', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCourse: (courseId: number, data: Partial<CourseCreateRequest>) =>
    apiFetch<{ message: string }>(`/instructor/courses/${courseId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCourse: (courseId: number) =>
    apiFetch<{ message: string }>(`/instructor/courses/${courseId}`, {
      method: 'DELETE',
    }),

  // 강의 영상(Lecture) 관리
  getCourseLectures: (courseId: number) =>
    apiFetch<Lecture[]>(`/instructor/courses/${courseId}/lectures`),

  createLecture: (courseId: number, data: LectureCreateRequest) =>
    apiFetch<{ message: string; lectureId: number }>(
      `/instructor/courses/${courseId}/lectures`,
      { method: 'POST', body: JSON.stringify(data) }
    ),

  updateLecture: (lectureId: number, data: Partial<LectureCreateRequest>) =>
    apiFetch<{ message: string }>(`/instructor/lectures/${lectureId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteLecture: (lectureId: number) =>
    apiFetch<{ message: string }>(`/instructor/lectures/${lectureId}`, {
      method: 'DELETE',
    }),
};

// ─── 댓글 API ────────────────────────────────────────────────

export const commentApi = {
  // 특정 강의의 댓글 목록 조회
  getByLecture: (lectureId: number) =>
    apiFetch<Comment[]>(`/comments/lecture/${lectureId}`),

  // 댓글 작성
  create: (lectureId: number, content: string) =>
    apiFetch<Comment>(`/comments/lecture/${lectureId}`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  // 댓글 삭제
  delete: (commentId: number) =>
    apiFetch<{ message: string }>(`/comments/${commentId}`, {
      method: 'DELETE',
    }),

  // 답글 작성 (강사/관리자만)
  createReply: (commentId: number, content: string) =>
    apiFetch<Reply>(`/comments/${commentId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  // 답글 삭제
  deleteReply: (replyId: number) =>
    apiFetch<{ message: string }>(`/comments/replies/${replyId}`, {
      method: 'DELETE',
    }),
};
