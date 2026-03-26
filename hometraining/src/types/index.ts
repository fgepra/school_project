// src/types/index.ts

// ─── DB 모델 타입 ───────────────────────────────────────────

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  weight: number | null;
  created_at: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  met_value: number;
  created_at: string;
  // JOIN 결과 추가 필드
  lecture_count?: number;
  thumbnail?: string;
}

export interface Lecture {
  id: number;
  course_id: number;
  title: string;
  video_url: string;
  duration: number; // 초 단위
}

export interface Progress {
  id: number;
  user_id: number;
  lecture_id: number;
  completed: boolean;
  watched_time: number; // 초 단위
}

export interface WorkoutRecord {
  id: number;
  user_id: number;
  lecture_id: number;
  exercise_time: number;
  calories_burned: number;
  date: string;
}

export interface Comment {
  id: number;
  user_id: number;
  lecture_id: number;
  content: string;
  created_at: string;
  // JOIN 결과 추가 필드
  user_name?: string;
}

// ─── API 요청/응답 타입 ─────────────────────────────────────

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  weight?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: Omit<User, 'password'>;
}

export interface ProgressSaveRequest {
  lecture_id: number;
  completed: boolean;
  watched_time: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ─── JWT Payload 타입 ────────────────────────────────────────

export interface JwtPayload {
  userId: number;
  email: string;
  iat?: number;
  exp?: number;
}
