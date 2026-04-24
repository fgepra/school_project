# HOMEFIT 개발 기능 체크리스트

> 최종 업데이트: 2026-04-16  
> 브랜치: `claude/distracted-northcutt`

---

## 1주차 · 2주차 — 학생 기능 (기초)

### 인증
- [x] 회원가입 (이름, 이메일, 비밀번호, 체중)
- [x] 로그인 (JWT 발급)
- [x] 로그아웃
- [x] 로그인 상태 유지 (localStorage)
- [x] 비로그인 접근 제한 (보호 라우트)

### 강의 조회 (학생)
- [x] 전체 강의 목록 페이지 (`/courses`)
- [x] 난이도 필터 (초급 / 중급 / 고급)
- [x] 강의 검색
- [x] 강의 상세 페이지 (`/courses/[id]`)
- [x] 강의별 영상 목록 + 진도 표시

### 강의 시청
- [x] 비디오 플레이어 (커스텀 컨트롤)
- [x] 재생 / 정지 / 시크바
- [x] 이전 / 다음 강의 이동
- [x] 시청 중 강의 사이드바 표시

### 진도 관리
- [x] 시청 시간 자동 저장 (5초 디바운스)
- [x] 90% 이상 시청 시 완료 처리
- [x] 진도 복원 (이어보기)
- [x] 강의별 완료 여부 표시 (✓)

### 학생 대시보드 (`/dashboard`)
- [x] 완료한 강의 수 통계
- [x] 총 시청 시간 통계
- [x] 수강 가능한 강의 수 통계
- [x] 강의 목록 미리보기 (최근 3개)

### 기본 UI
- [x] 다크 모드 전용 디자인 (CSS 변수 기반)
- [x] 반응형 그리드 레이아웃
- [x] 난이도 뱃지 (초급 / 중급 / 고급)
- [x] 로딩 스피너
- [x] 페이드인 애니메이션
- [x] Navbar (로고, 메뉴, 로그아웃)
- [x] 백엔드 미연결 시 목업 데이터 폴백

---

## 3주차 — 역할 분리 및 추가 기능

### DB 스키마 확장
- [x] `users.role` 컬럼 추가 (`student` / `instructor` / `admin`)
- [x] `courses.instructor_id` FK 추가
- [x] `lectures.order_num` 컬럼 추가
- [x] `COMMENTS` 테이블 생성
- [x] `REPLIES` 테이블 생성
- [x] SQL 마이그레이션 스크립트 작성 (`docs/p1.md`)

### 인증 — 역할 분리
- [x] 회원가입 시 역할 선택 (학생 / 강사)
- [x] JWT 토큰에 `role` 포함
- [x] 로그인 후 역할별 자동 리다이렉트 (관리자 → `/admin`, 강사 → `/instructor`, 학생 → `/dashboard`)
- [x] 역할 기반 미들웨어 (`requireAdmin`, `requireInstructor`)
- [x] 역할별 라우트 접근 제어 (`/admin`, `/instructor` 보호)

### 관리자 기능 (`/admin`)
- [x] 관리자 대시보드 (전체 유저 수, 강의 수, 영상 수, 완료 진도 통계)
- [x] 역할별 유저 분포 차트
- [x] 유저 목록 조회 (`/admin/users`)
- [x] 유저 역할 변경 (학생 ↔ 강사 ↔ 관리자)
- [x] 자기 자신 역할 변경 방지
- [x] 관리자 전용 Navbar 메뉴

### 강사 기능 (`/instructor`)
- [x] 강사 대시보드 (담당 강의 수, 전체 영상 수, 난이도 구성 통계)
- [x] 강의(Course) 목록 조회
- [x] 강의 생성 (`/instructor/courses/new`)
- [x] 강의 수정 (`/instructor/courses/[courseId]/edit`)
- [x] 강의 삭제 (확인 다이얼로그 포함)
- [x] 강의 영상(Lecture) 목록 조회 (`/instructor/courses/[courseId]/lectures`)
- [x] 강의 영상 추가 (제목, URL, 재생시간, 순서)
- [x] 강의 영상 삭제
- [x] 강사 전용 Navbar 메뉴
- [x] 본인 강의만 수정/삭제 가능 (관리자는 전체 가능)

### 댓글 / 답글 기능 (강의 시청 페이지)
- [x] 학생 — 댓글 작성
- [x] 학생 — 본인 댓글 삭제
- [x] 강사 / 관리자 — 댓글에 답글 작성
- [x] 강사 / 관리자 — 본인 답글 삭제
- [x] 관리자 — 모든 댓글 / 답글 삭제 가능
- [x] 댓글 작성자 역할 뱃지 표시 (강사 / 관리자)
- [x] 강사가 아닌 경우 '답글 달기' 버튼 숨김

### Navbar UI 개선
- [x] 역할별 메뉴 분기 (관리자 / 강사 / 학생)
- [x] 역할 뱃지 표시 (관리자 = 빨강, 강사 = 파랑, 학생 = 회색)
- [x] 로고 클릭 시 역할별 홈으로 이동

---

## 4주차 — 나머지 핵심 기능 구현

> 최종 업데이트: 2026-04-23

### 운동 기록
- [x] 강의 시청 후 운동 기록 저장 (소모 칼로리 계산, MET 값 활용)
- [x] 운동 기록 목록 / 히스토리 페이지 (`/workout`)
- [x] 날짜별 운동 기록 조회 (`workoutApi.getStats`)
- [x] 학생 대시보드에 칼로리 통계 연동

### 모션 캡처
- [x] 웹캠 기반 자세 인식 (MediaPipe Pose — `/motion`)
- [x] 강의 시청 중 실시간 자세 분석 (강의 페이지 내 패널로 통합)
- [x] 자세 피드백 UI (각도 점수 + 상태 뱃지 표시)
- [x] 모션 캡처 온/오프 토글 (강의 페이지 상단 버튼)

### 강사 기능 추가
- [x] 강의 영상 수정 (제목 / URL / 재생시간 인라인 편집)
- [x] 강의 영상 순서 드래그앤드롭 변경 (⣿ 핸들, HTML5 DnD, 백엔드 자동 저장)
- [x] 강의별 수강생 진도 현황 조회 (`/instructor/courses/[id]/progress`)

### 학생 기능 추가
- [x] 댓글 수정 (본인 댓글 인라인 편집)
- [x] 강의 즐겨찾기 / 북마크 (`/bookmarks`, ★ 토글 버튼)
- [x] 수강 완료 강의 목록 페이지 (`/completed`)

### 기타
- [x] 비밀번호 변경 (`/settings`)
- [x] 회원 탈퇴 (`/settings`)
- [x] 관리자 — 강의 직접 생성/삭제 (`/admin/courses`)
- [x] 이미지 업로드 (썸네일 — multer 기반 파일 업로드)
- [x] 검색 기능 고도화 (강사명 검색 포함, 강의 카드 강사명 표시)

---

## 5~6주차 — 운영 기능 및 고도화

> 최종 업데이트: 2026-04-23

### 결제
- [x] 결제 수단 등록 (카드사 선택, 카드번호/유효기간/CVC 입력 UI)
- [x] 강의 유료 결제 플로우 (시뮬레이션 — 1.5초 딜레이 후 완료)
- [x] 결제 완료 페이지 (`/payment/complete`)
- [x] 결제 내역 조회 (`/payment/history`)
- [x] 환불 요청 및 처리 (본인 / admin)
- [x] 강의 상세에 구매하기 버튼 표시 (미구매 시 잠금)
- [x] 강의 카드 / 상세에 가격 배지 (무료 / ₩N,000)
- [x] 결제 완료 시 알림 생성
- [x] `paymentApi` 추가 (api.ts)

### 정산 지표
- [x] `settlements` 테이블 생성
- [x] 강사별 수익 정산 내역 (`/instructor/settlement`)
- [x] 관리자 — 전체 매출 / 정산 대시보드 (`/admin/settlement`)
- [x] 기간별 매출 집계 (일 / 주 / 월 필터)
- [x] 정산 내보내기 (CSV)
- [x] 정산 수동 생성 (admin — YYYY-MM 입력)
- [x] `settlementApi` 추가 (api.ts)

### 로그
- [x] winston 설치 및 logger 설정 (`backend/utils/logger.js`)
- [x] `activity_logs` 테이블 생성
- [x] 서버 요청 로그 미들웨어 (`logMiddleware.js`)
- [x] 관리자 — 로그 조회 페이지 (`/admin/logs`, 최근 200개)
- [x] 로그 액션 필터 검색
- [x] 30일 이상 오래된 로그 삭제 버튼
- [x] `logApi` 추가 (api.ts)

### 스케줄링
- [x] node-cron 설치
- [x] `backend/scheduler.js` 구현
- [x] 매일 자정 — 30일+ 로그 자동 삭제
- [x] 매월 1일 — 지난달 정산 자동 생성
- [x] 매주 월요일 오전 9시 — 미완료 진도 알림 생성
- [x] app.js에서 스케줄러 등록

### 모니터링
- [x] 서버 상태 헬스체크 (`GET /api/health`)
- [x] 메트릭 미들웨어 (`metricsMiddleware.js` — 메모리 내 저장)
- [x] API 응답시간 / 에러율 통계 (`GET /api/monitor/stats`)
- [x] DB 연결 상태 체크
- [x] 관리자 — 실시간 서버 지표 대시보드 (`/admin/monitor`, 15초 자동 갱신)
- [x] `monitorApi` 추가 (api.ts)

### 알림
- [x] `notifications` 테이블 생성
- [x] 댓글에 답글 달릴 때 → 댓글 작성자 알림 생성 (commentController)
- [x] 결제 완료 시 → 구매자 알림 생성 (paymentController)
- [x] 진도 미완료 알림 (스케줄러 — 매주 월요일)
- [x] Navbar 알림 벨 (미읽음 수 뱃지, 드롭다운, 30초 폴링)
- [x] 전체 알림 목록 페이지 (`/notifications`)
- [x] 개별 / 전체 읽음 처리
- [x] 알림 삭제
- [x] `notificationApi` 추가 (api.ts)

### 리팩토링
- [x] 중앙 에러 핸들러 미들웨어 (`errorMiddleware.js`)
- [x] app.js 마지막에 에러 미들웨어 등록
- [x] 새 API는 `{ success, data, message }` 구조 통일
- [x] Payment, Notification, Settlement, HealthStatus, MonitorStats, ActivityLog 타입 추가 (types/index.ts)
