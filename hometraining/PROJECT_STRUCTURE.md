# 홈트레이닝 플랫폼 - 1~2주차 개발 가이드

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── api/                        # REST API 라우트
│   │   ├── auth/
│   │   │   ├── signup/route.ts     # POST /api/auth/signup
│   │   │   └── login/route.ts      # POST /api/auth/login
│   │   ├── courses/
│   │   │   ├── route.ts            # GET /api/courses
│   │   │   └── [id]/
│   │   │       ├── route.ts        # GET /api/courses/:id
│   │   │       └── lectures/
│   │   │           └── route.ts    # GET /api/courses/:id/lectures
│   │   ├── lectures/
│   │   │   └── [id]/route.ts       # GET /api/lectures/:id
│   │   └── progress/
│   │       ├── route.ts            # POST /api/progress
│   │       └── [userId]/route.ts   # GET /api/progress/:userId
│   ├── (auth)/                     # 인증 관련 페이지 그룹
│   │   ├── login/page.tsx
│   │   └── signup/page.tsx
│   ├── (main)/                     # 메인 앱 페이지 그룹
│   │   ├── layout.tsx              # 인증 체크 레이아웃
│   │   ├── dashboard/page.tsx      # 대시보드
│   │   └── courses/
│   │       ├── page.tsx            # 강의 목록
│   │       └── [id]/
│   │           ├── page.tsx        # 강의 상세
│   │           └── lectures/
│   │               └── [lectureId]/page.tsx  # 강의 시청
│   ├── layout.tsx                  # 루트 레이아웃
│   └── page.tsx                    # 홈 (→ 리다이렉트)
├── components/
│   ├── ui/                         # 공통 UI 컴포넌트
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── Card.tsx
│   ├── layout/
│   │   ├── Navbar.tsx
│   │   └── Sidebar.tsx
│   ├── course/
│   │   ├── CourseCard.tsx
│   │   ├── LectureList.tsx
│   │   └── VideoPlayer.tsx
│   └── auth/
│       └── AuthGuard.tsx
├── lib/
│   ├── db.ts                       # MySQL 연결
│   ├── auth.ts                     # JWT 유틸리티
│   └── api.ts                      # 클라이언트 API 함수
├── hooks/
│   ├── useAuth.ts                  # 인증 훅
│   └── useProgress.ts              # 진도 관리 훅
└── types/
    └── index.ts                    # 타입 정의
```

## 🚀 설치 및 실행 순서

### 1단계: 프로젝트 초기화
```bash
npx create-next-app@latest hometraining --typescript --tailwind --app
cd hometraining
npm install mysql2 jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs
```

### 2단계: 환경변수 설정
`.env.local` 파일을 생성하고 아래 내용 입력:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=hometraining
JWT_SECRET=your-secret-key-here
```

### 3단계: DB 테이블 생성
기획서의 MySQL SQL을 실행하여 테이블 생성

### 4단계: 개발 서버 실행
```bash
npm run dev
```

## 📋 구현 순서 (단계별)

1. **타입 정의** → types/index.ts
2. **DB 연결** → lib/db.ts
3. **JWT 유틸** → lib/auth.ts
4. **API 라우트** → app/api/...
5. **클라이언트 API** → lib/api.ts
6. **공통 UI** → components/ui/...
7. **인증 페이지** → (auth)/login, signup
8. **강의 목록** → (main)/courses
9. **강의 상세** → (main)/courses/[id]
10. **강의 시청 + 진도** → (main)/courses/[id]/lectures/[lectureId]
11. **대시보드** → (main)/dashboard
