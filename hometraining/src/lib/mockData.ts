// src/lib/mockData.ts
// API 미연결 상태에서 사용할 목 데이터

import { Course, Lecture } from '@/types';

export const MOCK_COURSES: Course[] = [
  {
    id: 1,
    title: '왕초보 전신 스트레칭 완성',
    description:
      '운동을 한 번도 해본 적 없어도 OK! 아침 기상 후 10분, 하루를 깨우는 전신 스트레칭 루틴입니다. 근육 이완과 관절 가동성을 높여 부상 없는 운동 습관의 첫걸음을 만들어 드립니다.',
    difficulty: 'beginner',
    met_value: 2.5,
    created_at: '2025-01-10T09:00:00',
    lecture_count: 8,
  },
  {
    id: 2,
    title: '홈트 기초 체력 다지기',
    description:
      '맨몸 운동의 기본기를 완성합니다. 스쿼트, 푸시업, 플랭크 등 홈트의 핵심 동작들을 올바른 자세부터 차근차근 익혀, 탄탄한 기초 체력을 쌓아보세요.',
    difficulty: 'beginner',
    met_value: 4.0,
    created_at: '2025-01-15T09:00:00',
    lecture_count: 12,
  },
  {
    id: 3,
    title: '30일 복근 챌린지',
    description:
      '매일 15분, 30일이면 식스팩이 보이기 시작합니다. 크런치, 레그레이즈, 마운틴클라이머 등 핵심 복근 운동을 단계적으로 강도를 높여가며 진행합니다.',
    difficulty: 'intermediate',
    met_value: 6.0,
    created_at: '2025-02-01T09:00:00',
    lecture_count: 30,
  },
  {
    id: 4,
    title: '상체 집중 덤벨 트레이닝',
    description:
      '덤벨 하나로 완성하는 어깨·가슴·등·팔 상체 집중 프로그램. 집에서도 헬스장 못지않은 상체 볼륨을 만들 수 있습니다. 10kg 이하 덤벨 한 쌍이면 충분합니다.',
    difficulty: 'intermediate',
    met_value: 5.5,
    created_at: '2025-02-10T09:00:00',
    lecture_count: 16,
  },
  {
    id: 5,
    title: '다이어트 HIIT 인터벌 트레이닝',
    description:
      '20초 운동 10초 휴식, 타바타 방식으로 짧고 강하게 칼로리를 태웁니다. 유산소와 근력을 동시에 자극하는 최강 지방 연소 프로그램으로, 한 세션에 최대 400kcal를 소모합니다.',
    difficulty: 'intermediate',
    met_value: 8.0,
    created_at: '2025-02-20T09:00:00',
    lecture_count: 20,
  },
  {
    id: 6,
    title: '하체 고강도 맨몸 프로그램',
    description:
      '점프 스쿼트, 불가리안 스플릿 스쿼트, 싱글레그 데드리프트까지. 맨몸만으로도 하체 근육을 극한까지 자극하는 고강도 루틴입니다. 근비대와 근지구력을 동시에 향상시킵니다.',
    difficulty: 'advanced',
    met_value: 9.0,
    created_at: '2025-03-01T09:00:00',
    lecture_count: 14,
  },
  {
    id: 7,
    title: '필라테스 코어 & 밸런스',
    description:
      '코어 근육을 깊숙이 자극하는 필라테스 기반 운동 프로그램입니다. 허리 통증 완화, 체형 교정, 균형 감각 향상에 탁월합니다. 매트 하나로 진행합니다.',
    difficulty: 'beginner',
    met_value: 3.0,
    created_at: '2025-03-10T09:00:00',
    lecture_count: 10,
  },
  {
    id: 8,
    title: '풀바디 써킷 트레이닝',
    description:
      '전신 근육을 하루에 한 번에 자극하는 써킷 방식 프로그램. 휴식 없이 이어지는 6가지 동작으로 심박수를 최고치로 끌어올려 체력과 근력을 동시에 향상합니다.',
    difficulty: 'advanced',
    met_value: 10.0,
    created_at: '2025-03-15T09:00:00',
    lecture_count: 18,
  },
];

// ─── 강의 영상 목 데이터 ─────────────────────────────────────
// course_id: 1 — 왕초보 전신 스트레칭 완성 (8강)
export const MOCK_LECTURES: Record<number, Lecture[]> = {
  1: [
    { id: 101, course_id: 1, title: '오리엔테이션 – 스트레칭이 왜 중요한가', video_url: '', duration: 480 },
    { id: 102, course_id: 1, title: '목·어깨 풀기 – 거북목 탈출 루틴', video_url: '', duration: 600 },
    { id: 103, course_id: 1, title: '가슴·등 스트레칭 – 굽은 등 교정', video_url: '', duration: 570 },
    { id: 104, course_id: 1, title: '허리·골반 스트레칭 – 요통 예방', video_url: '', duration: 660 },
    { id: 105, course_id: 1, title: '고관절 유연성 향상 루틴', video_url: '', duration: 720 },
    { id: 106, course_id: 1, title: '하체 전면 (대퇴사두·종아리) 스트레칭', video_url: '', duration: 600 },
    { id: 107, course_id: 1, title: '하체 후면 (햄스트링·둔근) 스트레칭', video_url: '', duration: 630 },
    { id: 108, course_id: 1, title: '마무리 – 10분 전신 통합 루틴', video_url: '', duration: 600 },
  ],

  // course_id: 2 — 홈트 기초 체력 다지기 (12강)
  2: [
    { id: 201, course_id: 2, title: '오리엔테이션 – 맨몸 운동의 원리', video_url: '', duration: 540 },
    { id: 202, course_id: 2, title: '워밍업 – 관절 가동 & 혈류 활성화', video_url: '', duration: 480 },
    { id: 203, course_id: 2, title: '스쿼트 기초 – 무릎 안 아프게 앉는 법', video_url: '', duration: 720 },
    { id: 204, course_id: 2, title: '푸시업 기초 – 자세 교정과 변형 동작', video_url: '', duration: 780 },
    { id: 205, course_id: 2, title: '플랭크 – 코어 안정화 핵심 원리', video_url: '', duration: 660 },
    { id: 206, course_id: 2, title: '런지 – 하체 균형 잡기', video_url: '', duration: 700 },
    { id: 207, course_id: 2, title: '힙 브릿지 – 둔근 활성화 루틴', video_url: '', duration: 600 },
    { id: 208, course_id: 2, title: '버피 입문 – 전신 유산소 기초', video_url: '', duration: 750 },
    { id: 209, course_id: 2, title: '상체 복합 루틴 (푸시업 + 파이크)', video_url: '', duration: 820 },
    { id: 210, course_id: 2, title: '하체 복합 루틴 (스쿼트 + 런지 서킷)', video_url: '', duration: 840 },
    { id: 211, course_id: 2, title: '코어 복합 루틴 (플랭크 + 마운틴클라이머)', video_url: '', duration: 780 },
    { id: 212, course_id: 2, title: '마무리 – 전신 기초 루틴 총정리', video_url: '', duration: 900 },
  ],
};

