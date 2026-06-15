// src/types/index.ts

// ─── DB 모델 타입 ───────────────────────────────────────────

export type UserRole = 'student' | 'instructor' | 'admin';

export interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  weight: number | null;
  role: UserRole;
  created_at: string;
}

export interface Course {
  id: number;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  met_value: number;
  instructor_id?: number | null;
  instructor_name?: string;
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
  order_num?: number;
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
  lecture_id: number | null;
  course_id: number | null;
  duration_sec: number;
  calories_burned: number;
  recorded_at: string;
  lecture_title?: string;
  course_title?: string;
}

export interface WorkoutDayStat {
  date: string;
  total_sessions: number;
  total_duration_sec: number;
  total_calories: number;
}

export interface StudentProgress {
  user_id: number;
  user_name: string;
  user_email: string;
  completed_count: number;
  total_watched_sec: number;
  last_activity: string | null;
}

export interface Comment {
  id: number;
  user_id: number;
  lecture_id: number;
  content: string;
  created_at: string;
  // JOIN 결과 추가 필드
  user_name?: string;
  user_role?: UserRole;
  replies?: Reply[];
}

export interface Reply {
  id: number;
  comment_id: number;
  user_id: number;
  content: string;
  created_at: string;
  // JOIN 결과 추가 필드
  user_name?: string;
  user_role?: UserRole;
}

// ─── API 요청/응답 타입 ─────────────────────────────────────

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  weight?: number;
  role?: UserRole;
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

export interface CourseCreateRequest {
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  met_value?: number;
  thumbnail?: string;
}

export interface LectureCreateRequest {
  title: string;
  video_url?: string;
  duration?: number;
  order_num?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// ─── JWT Payload 타입 ────────────────────────────────────────

export interface JwtPayload {
  id: number;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// ─── 관리자 통계 타입 ────────────────────────────────────────

export interface AdminStats {
  totalUsers: number;
  roleStats: { role: UserRole; count: number }[];
  totalCourses: number;
  totalLectures: number;
  completedProgress: number;
}

export interface BookmarkedCourse extends Course {
  bookmark_id: number;
}

// ─── 결제 타입 ──────────────────────────────────────────────

export interface Payment {
  id: number;
  user_id: number;
  course_id: number;
  amount: number;
  status: 'pending' | 'completed' | 'refunded';
  payment_method: string;
  card_last4: string;
  created_at: string;
  course_title?: string;
  difficulty?: string;
  user_name?: string;
  email?: string;
}

export interface PaymentRequest {
  courseId: number;
  amount: number;
  paymentMethod: string;
  cardLast4: string;
}

// ─── 알림 타입 ──────────────────────────────────────────────

export interface Notification {
  id: number;
  user_id: number;
  type: 'payment' | 'course_update' | 'progress' | 'system';
  title: string;
  message: string;
  is_read: 0 | 1;
  related_id: number | null;
  created_at: string;
}

// ─── 정산 타입 ──────────────────────────────────────────────

export interface Settlement {
  id: number;
  instructor_id: number;
  course_id: number;
  period: string;
  revenue: number;
  payout_rate: number;
  payout_amount: number;
  status: 'pending' | 'paid';
  created_at: string;
  course_title?: string;
  instructor_name?: string;
}

// ─── 모니터링 타입 ──────────────────────────────────────────

export interface HealthStatus {
  status: 'ok' | 'degraded';
  db: 'connected' | 'disconnected';
  uptime: number;
  nodeVersion: string;
  memory: { rss: number; heapUsed: number; heapTotal: number };
  timestamp: string;
}

export interface MonitorStats {
  totalRequests: number;
  errorCount: number;
  errorRate: number;
  avgResponseTime: number;
  uptimeSeconds: number;
  recentRequests: {
    method: string;
    path: string;
    status: number;
    duration: number;
    timestamp: string;
  }[];
}

// ─── 활동 로그 타입 ─────────────────────────────────────────

export interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  detail: string | null;
  ip_address: string | null;
  created_at: string;
}

// ─── 구독 타입 ──────────────────────────────────────────────

export interface Subscription {
  id: number;
  user_id: number;
  type: 'weekly_digest' | 'course_update' | 'promotion';
  is_active: 0 | 1;
  created_at: string;
}

// 강사 댓글 타입 (instructorApi 에서 사용)
export interface InstructorComment extends Comment {
  user_name: string;
  replies: Reply[];
  course_title?: string;
  course_id?: number;
  lecture_title?: string;
}
