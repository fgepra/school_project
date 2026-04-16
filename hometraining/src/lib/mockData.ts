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
    { id: 101, course_id: 1, title: '오리엔테이션 – 스트레칭이 왜 중요한가', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 480 },
    { id: 102, course_id: 1, title: '목·어깨 풀기 – 거북목 탈출 루틴', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 600 },
    { id: 103, course_id: 1, title: '가슴·등 스트레칭 – 굽은 등 교정', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 570 },
    { id: 104, course_id: 1, title: '허리·골반 스트레칭 – 요통 예방', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 660 },
    { id: 105, course_id: 1, title: '고관절 유연성 향상 루틴', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 720 },
    { id: 106, course_id: 1, title: '하체 전면 (대퇴사두·종아리) 스트레칭', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 600 },
    { id: 107, course_id: 1, title: '하체 후면 (햄스트링·둔근) 스트레칭', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 630 },
    { id: 108, course_id: 1, title: '마무리 – 10분 전신 통합 루틴', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 600 },
  ],

  // course_id: 2 — 홈트 기초 체력 다지기 (12강)
  2: [
    { id: 201, course_id: 2, title: '오리엔테이션 – 맨몸 운동의 원리', video_url: 'https://www.youtube.com/watch?v=IODxDxX7oi4', duration: 540 },
    { id: 202, course_id: 2, title: '워밍업 – 관절 가동 & 혈류 활성화', video_url: 'https://www.youtube.com/watch?v=CBr8chDmYTU', duration: 480 },
    { id: 203, course_id: 2, title: '스쿼트 기초 – 무릎 안 아프게 앉는 법', video_url: 'https://www.youtube.com/watch?v=U3HlEF_E9fo', duration: 720 },
    { id: 204, course_id: 2, title: '푸시업 기초 – 자세 교정과 변형 동작', video_url: 'https://www.youtube.com/watch?v=1oJxuQCxYIY', duration: 780 },
    { id: 205, course_id: 2, title: '플랭크 – 코어 안정화 핵심 원리', video_url: 'https://www.youtube.com/watch?v=ASdvN_XEl_c', duration: 660 },
    { id: 206, course_id: 2, title: '런지 – 하체 균형 잡기', video_url: 'https://www.youtube.com/watch?v=D7KaRcUTQeE', duration: 700 },
    { id: 207, course_id: 2, title: '힙 브릿지 – 둔근 활성화 루틴', video_url: 'https://www.youtube.com/watch?v=8bbE64NuDTU', duration: 600 },
    { id: 208, course_id: 2, title: '버피 입문 – 전신 유산소 기초', video_url: 'https://www.youtube.com/watch?v=dZgVxmf6jkA', duration: 750 },
    { id: 209, course_id: 2, title: '상체 복합 루틴 (푸시업 + 파이크)', video_url: 'https://www.youtube.com/watch?v=IODxDxX7oi4', duration: 820 },
    { id: 210, course_id: 2, title: '하체 복합 루틴 (스쿼트 + 런지 서킷)', video_url: 'https://www.youtube.com/watch?v=U3HlEF_E9fo', duration: 840 },
    { id: 211, course_id: 2, title: '코어 복합 루틴 (플랭크 + 마운틴클라이머)', video_url: 'https://www.youtube.com/watch?v=ASdvN_XEl_c', duration: 780 },
    { id: 212, course_id: 2, title: '마무리 – 전신 기초 루틴 총정리', video_url: 'https://www.youtube.com/watch?v=CBr8chDmYTU', duration: 900 },
  ],

  // course_id: 3 — 30일 복근 챌린지 (30강)
  3: [
    { id: 301, course_id: 3, title: '오리엔테이션 – 30일 플랜 소개', video_url: '', duration: 480 },
    { id: 302, course_id: 3, title: '[1주차] Day 1 – 복근 해부학과 기초 크런치', video_url: '', duration: 600 },
    { id: 303, course_id: 3, title: '[1주차] Day 2 – 레그레이즈 입문', video_url: '', duration: 620 },
    { id: 304, course_id: 3, title: '[1주차] Day 3 – 플랭크 코어 연결', video_url: '', duration: 600 },
    { id: 305, course_id: 3, title: '[1주차] Day 4 – 사이드 플랭크 & 옆구리 자극', video_url: '', duration: 660 },
    { id: 306, course_id: 3, title: '[1주차] Day 5 – 리버스 크런치', video_url: '', duration: 640 },
    { id: 307, course_id: 3, title: '[1주차] Day 6 – 바이시클 크런치', video_url: '', duration: 680 },
    { id: 308, course_id: 3, title: '[1주차] Day 7 – 1주차 복습 & 휴식 스트레칭', video_url: '', duration: 540 },
    { id: 309, course_id: 3, title: '[2주차] Day 8 – 강도 업 크런치 변형 3종', video_url: '', duration: 720 },
    { id: 310, course_id: 3, title: '[2주차] Day 9 – 행잉 니레이즈 대체 루틴', video_url: '', duration: 700 },
    { id: 311, course_id: 3, title: '[2주차] Day 10 – 마운틴클라이머 인터벌', video_url: '', duration: 740 },
    { id: 312, course_id: 3, title: '[2주차] Day 11 – 브이업 & 토터치', video_url: '', duration: 760 },
    { id: 313, course_id: 3, title: '[2주차] Day 12 – 플러터킥 지구력 루틴', video_url: '', duration: 720 },
    { id: 314, course_id: 3, title: '[2주차] Day 13 – 코어 안정화 복합 세트', video_url: '', duration: 780 },
    { id: 315, course_id: 3, title: '[2주차] Day 14 – 2주차 복습 & 중간 점검', video_url: '', duration: 600 },
    { id: 316, course_id: 3, title: '[3주차] Day 15 – 고강도 타바타 복근 루틴', video_url: '', duration: 800 },
    { id: 317, course_id: 3, title: '[3주차] Day 16 – 드래곤 플래그 입문', video_url: '', duration: 820 },
    { id: 318, course_id: 3, title: '[3주차] Day 17 – 복사근 집중 사이드 크런치', video_url: '', duration: 760 },
    { id: 319, course_id: 3, title: '[3주차] Day 18 – 롤아웃 & AB 슬라이드 대체', video_url: '', duration: 800 },
    { id: 320, course_id: 3, title: '[3주차] Day 19 – 레그레이즈 고급 변형', video_url: '', duration: 780 },
    { id: 321, course_id: 3, title: '[3주차] Day 20 – 전신 코어 서킷 1라운드', video_url: '', duration: 840 },
    { id: 322, course_id: 3, title: '[3주차] Day 21 – 3주차 복습 & 체형 체크', video_url: '', duration: 600 },
    { id: 323, course_id: 3, title: '[4주차] Day 22 – 최고 강도 복근 세트', video_url: '', duration: 900 },
    { id: 324, course_id: 3, title: '[4주차] Day 23 – 풀업 바 없이 상부 복근 극한 자극', video_url: '', duration: 860 },
    { id: 325, course_id: 3, title: '[4주차] Day 24 – 하부 복근 번아웃 루틴', video_url: '', duration: 840 },
    { id: 326, course_id: 3, title: '[4주차] Day 25 – 옆구리·복사근 파이널 세트', video_url: '', duration: 820 },
    { id: 327, course_id: 3, title: '[4주차] Day 26 – 전신 코어 서킷 2라운드', video_url: '', duration: 900 },
    { id: 328, course_id: 3, title: '[4주차] Day 27 – 인터벌 복근 파괴 루틴', video_url: '', duration: 880 },
    { id: 329, course_id: 3, title: '[4주차] Day 28 – 30일 챌린지 마지막 풀루틴', video_url: '', duration: 960 },
    { id: 330, course_id: 3, title: '마무리 – 체성분 비교 & 다음 단계 가이드', video_url: '', duration: 540 },
  ],

  // course_id: 4 — 상체 집중 덤벨 트레이닝 (16강)
  4: [
    { id: 401, course_id: 4, title: '오리엔테이션 – 덤벨 선택과 안전 사용법', video_url: '', duration: 540 },
    { id: 402, course_id: 4, title: '워밍업 – 어깨·회전근개 활성화', video_url: '', duration: 480 },
    { id: 403, course_id: 4, title: '가슴 집중 – 덤벨 플로어 프레스', video_url: '', duration: 780 },
    { id: 404, course_id: 4, title: '가슴 집중 – 덤벨 플라이 & 풀오버', video_url: '', duration: 800 },
    { id: 405, course_id: 4, title: '어깨 집중 – 덤벨 숄더 프레스', video_url: '', duration: 760 },
    { id: 406, course_id: 4, title: '어깨 집중 – 레터럴·프론트·리어 레이즈 3종', video_url: '', duration: 820 },
    { id: 407, course_id: 4, title: '등 집중 – 덤벨 벤트오버 로우', video_url: '', duration: 780 },
    { id: 408, course_id: 4, title: '등 집중 – 싱글암 로우 & 풀오버', video_url: '', duration: 800 },
    { id: 409, course_id: 4, title: '이두 집중 – 바이셉 컬 3가지 그립', video_url: '', duration: 720 },
    { id: 410, course_id: 4, title: '삼두 집중 – 오버헤드 익스텐션 & 킥백', video_url: '', duration: 740 },
    { id: 411, course_id: 4, title: '전완·악력 강화 루틴', video_url: '', duration: 660 },
    { id: 412, course_id: 4, title: '상체 복합 세트 1 – 가슴·어깨 슈퍼세트', video_url: '', duration: 900 },
    { id: 413, course_id: 4, title: '상체 복합 세트 2 – 등·이두 슈퍼세트', video_url: '', duration: 900 },
    { id: 414, course_id: 4, title: '상체 복합 세트 3 – 어깨·삼두 슈퍼세트', video_url: '', duration: 880 },
    { id: 415, course_id: 4, title: '상체 풀루틴 – 전체 부위 순환 세트', video_url: '', duration: 1020 },
    { id: 416, course_id: 4, title: '마무리 – 상체 쿨다운 & 근막 이완', video_url: '', duration: 540 },
  ],

  // course_id: 5 — 다이어트 HIIT 인터벌 트레이닝 (20강)
  5: [
    { id: 501, course_id: 5, title: '오리엔테이션 – HIIT 원리와 타바타 이해', video_url: '', duration: 540 },
    { id: 502, course_id: 5, title: '워밍업 – 동적 스트레칭 & 심박수 올리기', video_url: '', duration: 480 },
    { id: 503, course_id: 5, title: '[입문] 타바타 기초 – 점핑잭 & 하이니', video_url: '', duration: 720 },
    { id: 504, course_id: 5, title: '[입문] 타바타 기초 – 스쿼트점프 & 버피', video_url: '', duration: 740 },
    { id: 505, course_id: 5, title: '[입문] 전신 유산소 인터벌 15분', video_url: '', duration: 900 },
    { id: 506, course_id: 5, title: '[중급] 상체 HIIT – 푸시업 변형 인터벌', video_url: '', duration: 780 },
    { id: 507, course_id: 5, title: '[중급] 하체 HIIT – 스쿼트·런지 인터벌', video_url: '', duration: 800 },
    { id: 508, course_id: 5, title: '[중급] 코어 HIIT – 마운틴클라이머 & 플러터킥', video_url: '', duration: 760 },
    { id: 509, course_id: 5, title: '[중급] 전신 HIIT 20분 풀루틴', video_url: '', duration: 1200 },
    { id: 510, course_id: 5, title: '[중급] 유산소 + 근력 혼합 인터벌', video_url: '', duration: 960 },
    { id: 511, course_id: 5, title: '[고급] 4라운드 타바타 – 하체 폭발력', video_url: '', duration: 840 },
    { id: 512, course_id: 5, title: '[고급] 4라운드 타바타 – 상체 & 코어', video_url: '', duration: 840 },
    { id: 513, course_id: 5, title: '[고급] 버피 인터벌 – 10가지 변형', video_url: '', duration: 900 },
    { id: 514, course_id: 5, title: '[고급] 30분 지방 연소 HIIT 풀루틴', video_url: '', duration: 1800 },
    { id: 515, course_id: 5, title: '[도전] 50분 HIIT 마라톤 세션', video_url: '', duration: 3000 },
    { id: 516, course_id: 5, title: '영양 가이드 – HIIT에 맞는 식단 전략', video_url: '', duration: 660 },
    { id: 517, course_id: 5, title: '회복 루틴 – 운동 후 필수 쿨다운', video_url: '', duration: 600 },
    { id: 518, course_id: 5, title: '주간 프로그램 짜는 법 – 3일·5일 플랜', video_url: '', duration: 720 },
    { id: 519, course_id: 5, title: '고원 현상 극복 – 정체기 탈출 전략', video_url: '', duration: 680 },
    { id: 520, course_id: 5, title: '마무리 – 4주 후 몸의 변화와 다음 목표 설정', video_url: '', duration: 600 },
  ],

  // course_id: 6 — 하체 고강도 맨몸 프로그램 (14강)
  6: [
    { id: 601, course_id: 6, title: '오리엔테이션 – 고강도 하체 훈련의 원칙', video_url: '', duration: 540 },
    { id: 602, course_id: 6, title: '워밍업 – 고관절·무릎·발목 완전 가동 루틴', video_url: '', duration: 600 },
    { id: 603, course_id: 6, title: '점프 스쿼트 – 폭발력과 착지 제어 마스터', video_url: '', duration: 840 },
    { id: 604, course_id: 6, title: '불가리안 스플릿 스쿼트 – 좌우 균형 하체 완성', video_url: '', duration: 900 },
    { id: 605, course_id: 6, title: '싱글레그 데드리프트 – 햄스트링·둔근 극한 자극', video_url: '', duration: 860 },
    { id: 606, course_id: 6, title: '피스톨 스쿼트 입문 – 단계별 보조 동작', video_url: '', duration: 920 },
    { id: 607, course_id: 6, title: '점프 런지 & 스케이터 점프 – 측면 폭발력', video_url: '', duration: 840 },
    { id: 608, course_id: 6, title: '월 싯 인터벌 – 대퇴사두 지구력 한계 돌파', video_url: '', duration: 780 },
    { id: 609, course_id: 6, title: '힙 트러스트 고급 – 싱글레그 & 밴드 응용', video_url: '', duration: 820 },
    { id: 610, course_id: 6, title: '하체 서킷 1 – 4가지 동작 무휴식 3라운드', video_url: '', duration: 1080 },
    { id: 611, course_id: 6, title: '하체 서킷 2 – 점프 계열 폭발적 5가지 동작', video_url: '', duration: 1080 },
    { id: 612, course_id: 6, title: '종아리·발목 강화 – 균형 & 순발력 보조 루틴', video_url: '', duration: 660 },
    { id: 613, course_id: 6, title: '하체 번아웃 세트 – 전부위 드롭세트 파이널', video_url: '', duration: 1200 },
    { id: 614, course_id: 6, title: '마무리 – 하체 쿨다운 & 근막 이완 스트레칭', video_url: '', duration: 600 },
  ],

  // course_id: 7 — 필라테스 코어 & 밸런스 (10강)
  7: [
    { id: 701, course_id: 7, title: '오리엔테이션 – 필라테스 호흡법과 코어 연결', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 540 },
    { id: 702, course_id: 7, title: '중립 척추 찾기 – 올바른 자세의 기준점', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 600 },
    { id: 703, course_id: 7, title: '헌드레드 – 복부 심층근 활성화', video_url: 'https://www.youtube.com/watch?v=8bbE64NuDTU', duration: 660 },
    { id: 704, course_id: 7, title: '롤업 & 롤다운 – 척추 분절 이동 훈련', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 720 },
    { id: 705, course_id: 7, title: '싱글레그 서클 – 고관절 가동성 & 골반 안정', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 680 },
    { id: 706, course_id: 7, title: '스완 & 차일드 포즈 – 등 신전 & 이완', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 640 },
    { id: 707, course_id: 7, title: '사이드킥 시리즈 – 외전근·둔근 & 균형 훈련', video_url: 'https://www.youtube.com/watch?v=8bbE64NuDTU', duration: 700 },
    { id: 708, course_id: 7, title: '티저 입문 – 전신 균형·코어 통합 동작', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 780 },
    { id: 709, course_id: 7, title: '스탠딩 밸런스 – 한 발 중심 & 체형 교정', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 720 },
    { id: 710, course_id: 7, title: '마무리 – 전신 이완 & 10강 통합 복습 루틴', video_url: 'https://www.youtube.com/watch?v=LZWORB39zQk', duration: 600 },
  ],

  // course_id: 8 — 풀바디 써킷 트레이닝 (18강)
  8: [
    { id: 801, course_id: 8, title: '오리엔테이션 – 써킷 트레이닝의 구조와 원리', video_url: '', duration: 540 },
    { id: 802, course_id: 8, title: '워밍업 – 전신 동적 활성화 루틴', video_url: '', duration: 600 },
    { id: 803, course_id: 8, title: '[써킷 A] 상체 중심 6동작 – 1라운드', video_url: '', duration: 960 },
    { id: 804, course_id: 8, title: '[써킷 A] 상체 중심 6동작 – 2·3라운드 강도 업', video_url: '', duration: 1020 },
    { id: 805, course_id: 8, title: '[써킷 B] 하체 중심 6동작 – 1라운드', video_url: '', duration: 960 },
    { id: 806, course_id: 8, title: '[써킷 B] 하체 중심 6동작 – 2·3라운드 강도 업', video_url: '', duration: 1020 },
    { id: 807, course_id: 8, title: '[써킷 C] 코어 집중 6동작 – 전 라운드', video_url: '', duration: 900 },
    { id: 808, course_id: 8, title: '[써킷 D] 유산소 폭발력 6동작 – 전 라운드', video_url: '', duration: 960 },
    { id: 809, course_id: 8, title: '[복합 써킷] 상체 + 하체 교차 8동작', video_url: '', duration: 1080 },
    { id: 810, course_id: 8, title: '[복합 써킷] 코어 + 유산소 교차 8동작', video_url: '', duration: 1080 },
    { id: 811, course_id: 8, title: '[도전 써킷] 전신 10동작 무휴식 풀루틴', video_url: '', duration: 1200 },
    { id: 812, course_id: 8, title: '써킷 인터벌 변형 – EMOM 방식 적용', video_url: '', duration: 900 },
    { id: 813, course_id: 8, title: '써킷 인터벌 변형 – AMRAP 방식 적용', video_url: '', duration: 900 },
    { id: 814, course_id: 8, title: '페어드 써킷 – 길항근 슈퍼세트 구성', video_url: '', duration: 960 },
    { id: 815, course_id: 8, title: '30분 풀바디 써킷 – 실전 세션 A', video_url: '', duration: 1800 },
    { id: 816, course_id: 8, title: '30분 풀바디 써킷 – 실전 세션 B', video_url: '', duration: 1800 },
    { id: 817, course_id: 8, title: '프로그램 설계 가이드 – 주 4일 써킷 플랜', video_url: '', duration: 720 },
    { id: 818, course_id: 8, title: '마무리 – 전신 쿨다운 & 다음 단계 로드맵', video_url: '', duration: 600 },
  ],
};
