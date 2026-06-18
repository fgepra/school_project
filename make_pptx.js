const pptxgen = require("pptxgenjs");

const pres = new pptxgen();
pres.layout = 'LAYOUT_16x9';
pres.title = 'HOMEFIT P3 개발 보고서';

const C = {
  bg_dark:  '0F1923',
  bg_card:  '1A2535',
  bg_card2: '1E2D40',
  bg_code:  '0D1117',
  accent:   '00C4A0',
  accent2:  '3B82F6',
  warn:     'F59E0B',
  danger:   'EF4444',
  success:  '22C55E',
  purple:   '8B5CF6',
  white:    'FFFFFF',
  gray:     '94A3B8',
  light:    'CBD5E1',
  border:   '2D3F55',
};

const mkShadow = () => ({ type: "outer", blur: 10, offset: 3, angle: 135, color: "000000", opacity: 0.28 });

function slideHeader(s, title, accentColor) {
  const col = accentColor || C.accent;
  s.background = { color: C.bg_dark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.07, fill: { color: col }, line: { color: col } });
  s.addText(title, {
    x: 0.55, y: 0.16, w: 9.1, h: 0.58,
    fontSize: 24, bold: true, color: C.white, fontFace: 'Arial', margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y: 0.76, w: 1.0, h: 0.04, fill: { color: col }, line: { color: col } });
}

function codeBlock(s, x, y, w, h, code, borderColor) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color: C.bg_code }, line: { color: borderColor || C.border, pt: 1 } });
  s.addText(code, {
    x: x + 0.18, y: y + 0.1, w: w - 0.36, h: h - 0.2,
    fontSize: 10.5, fontFace: 'Consolas', color: 'E2E8F0', valign: 'top', margin: 0,
  });
}

function chip(s, x, y, w, h, text, color) {
  s.addShape(pres.shapes.RECTANGLE, { x, y, w, h, fill: { color, transparency: 85 }, line: { color, pt: 1 } });
  s.addText(text, {
    x: x + 0.1, y, w: w - 0.1, h,
    fontSize: 12, bold: true, color, valign: 'middle', margin: 0,
  });
}

// ══════════════════════════════════════════
// SLIDE 1: 표지
// ══════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.bg_dark };

  // 상단 굵은 바
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.12, fill: { color: C.accent }, line: { color: C.accent } });

  // 좌측 세로 바
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0.12, w: 0.1, h: 5.505, fill: { color: C.accent }, line: { color: C.accent } });

  // 우측 장식 사각형 (배경 포인트)
  s.addShape(pres.shapes.RECTANGLE, { x: 7.2, y: 0.5, w: 2.8, h: 4.5, fill: { color: C.bg_card }, line: { color: C.border, pt: 1 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 7.2, y: 0.5, w: 2.8, h: 0.07, fill: { color: C.accent }, line: { color: C.accent } });

  // HOMEFIT 큰 타이틀
  s.addText('HOMEFIT', {
    x: 0.5, y: 0.65, w: 6.5, h: 1.1,
    fontSize: 58, bold: true, color: C.accent, fontFace: 'Arial Black', charSpacing: 6, margin: 0,
  });

  s.addText('P3 개발 보고서', {
    x: 0.5, y: 1.85, w: 6.5, h: 0.72,
    fontSize: 30, bold: true, color: C.white, fontFace: 'Arial', margin: 0,
  });

  // 구분선
  s.addShape(pres.shapes.RECTANGLE, { x: 0.5, y: 2.7, w: 5.0, h: 0.05, fill: { color: C.accent }, line: { color: C.accent } });

  s.addText('신규 기능 개발 및 주요 문제 해결 과정', {
    x: 0.5, y: 2.88, w: 6.5, h: 0.44,
    fontSize: 15, color: C.gray, fontFace: 'Arial', margin: 0,
  });

  // 우측 박스 내용
  s.addText('P3 주요 개발', {
    x: 7.3, y: 0.72, w: 2.6, h: 0.42,
    fontSize: 13, bold: true, color: C.accent, align: 'center', margin: 0,
  });
  const tags = ['결제 시스템', '알림 시스템', '정산 관리', '강사 댓글', '자동 로그아웃'];
  tags.forEach((t, i) => {
    const y = 1.28 + i * 0.64;
    s.addShape(pres.shapes.RECTANGLE, { x: 7.4, y, w: 1.7, h: 0.46, fill: { color: C.bg_card2 }, line: { color: C.accent, pt: 1 } });
    s.addText(t, {
      x: 7.4, y, w: 1.7, h: 0.46,
      fontSize: 11.5, color: C.accent, align: 'center', valign: 'middle', bold: true, margin: 0,
    });
  });

  // 기능 태그 (하단)
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.25, w: 10, h: 0.375, fill: { color: C.bg_card }, line: { color: C.bg_card } });
  s.addText('홈트레이닝 플랫폼  |  팀 프로젝트 P3 발표', {
    x: 0.5, y: 5.27, w: 9, h: 0.33,
    fontSize: 12, color: C.gray, align: 'center', valign: 'middle', margin: 0,
  });
}

// ══════════════════════════════════════════
// SLIDE 2: 목차
// ══════════════════════════════════════════
{
  const s = pres.addSlide();
  slideHeader(s, '목차');

  const items = [
    { num: '01', title: '트러블슈팅',                    sub: '개발 중 발생한 주요 문제 2가지와 해결 방법',          c: C.danger },
    { num: '02', title: 'P3 개발 기능 개요',             sub: '이번 스프린트에서 새롭게 구현한 기능 목록',          c: C.accent },
    { num: '03', title: '결제 시스템',                   sub: '강의 구매 · 결제 처리 · 환불 · 구매 여부 확인',     c: C.accent2 },
    { num: '04', title: '알림 / 정산 / 로그 / 모니터링', sub: '사용자 알림, 강사 정산, 활동 로그, 서버 상태 관리', c: C.warn },
    { num: '05', title: '강사 댓글 조회  &  자동 로그아웃', sub: '강의 댓글 통합 뷰  /  JWT 만료 자동 처리',       c: C.purple },
  ];

  items.forEach((item, i) => {
    const y = 0.96 + i * 0.9;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.55, y, w: 8.9, h: 0.78,
      fill: { color: C.bg_card }, line: { color: C.border, pt: 1 }, shadow: mkShadow(),
    });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y, w: 0.08, h: 0.78, fill: { color: item.c }, line: { color: item.c } });

    // 번호
    s.addShape(pres.shapes.RECTANGLE, { x: 0.73, y: y + 0.18, w: 0.52, h: 0.42, fill: { color: item.c, transparency: 80 }, line: { color: item.c, pt: 1 } });
    s.addText(item.num, { x: 0.73, y: y + 0.18, w: 0.52, h: 0.42, fontSize: 12, bold: true, color: item.c, align: 'center', valign: 'middle', margin: 0 });

    s.addText(item.title, { x: 1.38, y: y + 0.09, w: 7.9, h: 0.34, fontSize: 14, bold: true, color: C.white, margin: 0 });
    s.addText(item.sub,   { x: 1.38, y: y + 0.44, w: 7.9, h: 0.26, fontSize: 11.5, color: C.gray, margin: 0 });
  });
}

// ══════════════════════════════════════════
// SLIDE 3: 트러블슈팅 — 문제 1
// ══════════════════════════════════════════
{
  const s = pres.addSlide();
  slideHeader(s, '01  트러블슈팅  |  문제 1  —  로그인 "Failed to fetch" 오류', C.danger);

  // 상황
  s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y: 0.93, w: 8.9, h: 0.48, fill: { color: C.bg_card2 }, line: { color: C.border, pt: 1 } });
  s.addText('상황  |  AWS EC2 배포 후 로그인 시도 시 "Failed to fetch" 오류 발생 — 로그인 자체가 불가능한 상태', {
    x: 0.72, y: 0.93, w: 8.56, h: 0.48, fontSize: 12, color: C.gray, valign: 'middle', margin: 0,
  });

  // 원인
  chip(s, 0.55, 1.55, 8.9, 0.40, '원인  |  BASE_URL이 localhost:5000으로 하드코딩 → 브라우저가 사용자 PC의 localhost로 요청 시도', C.danger);

  // Before / After 코드 (좌우)
  s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y: 2.08, w: 4.2, h: 1.1, fill: { color: C.bg_code }, line: { color: C.danger, pt: 1 } });
  s.addText('Before', { x: 0.7, y: 2.1, w: 3.9, h: 0.28, fontSize: 10.5, color: C.danger, bold: true, margin: 0 });
  s.addText("// 클라이언트에서도 localhost로 요청\nconst BASE_URL = 'http://localhost:5000/api';", {
    x: 0.7, y: 2.4, w: 3.9, h: 0.72, fontSize: 10.5, fontFace: 'Consolas', color: 'E2E8F0', valign: 'top', margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: 2.08, w: 4.15, h: 1.1, fill: { color: C.bg_code }, line: { color: C.accent, pt: 1 } });
  s.addText('After', { x: 5.45, y: 2.1, w: 3.85, h: 0.28, fontSize: 10.5, color: C.accent, bold: true, margin: 0 });
  s.addText("const BASE_URL = typeof window === 'undefined'\n  ? 'http://localhost:5000/api'  // SSR\n  : '/api';  // 클라이언트 (Nginx 프록시)", {
    x: 5.45, y: 2.4, w: 3.85, h: 0.72, fontSize: 10.5, fontFace: 'Consolas', color: 'E2E8F0', valign: 'top', margin: 0,
  });

  // 해결
  chip(s, 0.55, 3.3, 8.9, 0.40, '해결  |  Nginx 리버스 프록시 설정 추가  +  BASE_URL을 SSR / 클라이언트 분기 처리', C.accent);

  // Nginx 설정 코드
  codeBlock(s, 0.55, 3.82, 8.9, 1.05,
    "# /etc/nginx/conf.d/homefit.conf\nlocation /api/ { proxy_pass http://localhost:5000/api/; }   # API 요청 → Express\nlocation /uploads/ { proxy_pass http://localhost:5000/uploads/; }  # 파일 요청\nlocation / { proxy_pass http://localhost:3000; }               # 나머지 → Next.js",
    C.accent);

  // 결과 요약 3칸
  const results = [
    { label: '브라우저 요청',  val: '/api/* → Nginx → Express :5000', c: C.accent },
    { label: 'SSR 요청',      val: 'localhost:5000 직접 호출',         c: C.accent },
    { label: '결과',          val: '로그인 정상 동작 확인',             c: C.success },
  ];
  results.forEach((r, i) => {
    const x = 0.55 + i * 3.05;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 4.98, w: 2.9, h: 0.65, fill: { color: C.bg_card }, line: { color: C.border, pt: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 4.98, w: 0.07, h: 0.65, fill: { color: r.c }, line: { color: r.c } });
    s.addText(r.label, { x: x + 0.18, y: 5.0,  w: 2.6, h: 0.22, fontSize: 10.5, color: C.gray, margin: 0 });
    s.addText(r.val,   { x: x + 0.18, y: 5.24, w: 2.6, h: 0.3,  fontSize: 11,   bold: true, color: r.c, margin: 0 });
  });
}

// ══════════════════════════════════════════
// SLIDE 4: 트러블슈팅 — 문제 2
// ══════════════════════════════════════════
{
  const s = pres.addSlide();
  slideHeader(s, '01  트러블슈팅  |  문제 2  —  강의 가격이 0원으로 표시', C.danger);

  // 상황
  s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y: 0.93, w: 8.9, h: 0.48, fill: { color: C.bg_card2 }, line: { color: C.border, pt: 1 } });
  s.addText('상황  |  DB에 가격(9,900 ~ 15,900원)이 저장되어 있는데 강의 상세 페이지에서 전부 0원 표시 → 결제 버튼 미노출', {
    x: 0.72, y: 0.93, w: 8.56, h: 0.48, fontSize: 12, color: C.gray, valign: 'middle', margin: 0,
  });

  chip(s, 0.55, 1.55, 8.9, 0.40, '원인  |  백엔드 routes/courses.js에 GET /:id 라우트가 없어 404 반환 → 프론트엔드가 Mock 데이터로 폴백', C.danger);

  // 원인 흐름도
  const flow = [
    { t: 'GET /api/courses/:id', c: C.accent2 },
    { t: 'Express\n라우트 없음 404', c: C.danger },
    { t: 'catch 블록\nMock 데이터 폴백', c: C.warn },
    { t: 'Mock에 price 없음\n→ 0원 표시', c: C.danger },
  ];
  flow.forEach((f, i) => {
    const x = 0.55 + i * 2.32;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 2.1, w: 2.15, h: 0.82,
      fill: { color: C.bg_card }, line: { color: f.c, pt: 1.5 },
    });
    s.addText(f.t, { x, y: 2.1, w: 2.15, h: 0.82, fontSize: 11.5, bold: true, color: f.c, align: 'center', valign: 'middle', margin: [0, 0.1, 0, 0.1] });
    if (i < 3) {
      s.addShape(pres.shapes.RECTANGLE, { x: x + 2.17, y: 2.42, w: 0.15, h: 0.18, fill: { color: C.gray }, line: { color: C.gray } });
    }
  });

  chip(s, 0.55, 3.08, 8.9, 0.40, '해결  |  getCourseById 컨트롤러 추가  +  GET /:id 라우트 등록  +  목록 카드에 가격 뱃지 추가', C.accent);

  // Before / After 코드
  s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y: 3.6, w: 4.2, h: 1.2, fill: { color: C.bg_code }, line: { color: C.danger, pt: 1 } });
  s.addText('Before  —  routes/courses.js', { x: 0.7, y: 3.62, w: 3.9, h: 0.28, fontSize: 10.5, color: C.danger, bold: true, margin: 0 });
  s.addText("router.get('/', controller.getCourses);\n// GET /:id 없음 → 404 반환\n// 프론트는 catch에서 Mock 폴백 처리", {
    x: 0.7, y: 3.93, w: 3.9, h: 0.8, fontSize: 10.5, fontFace: 'Consolas', color: 'E2E8F0', valign: 'top', margin: 0,
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: 3.6, w: 4.15, h: 1.2, fill: { color: C.bg_code }, line: { color: C.accent, pt: 1 } });
  s.addText('After  —  routes/courses.js', { x: 5.45, y: 3.62, w: 3.85, h: 0.28, fontSize: 10.5, color: C.accent, bold: true, margin: 0 });
  s.addText("router.get('/', controller.getCourses);\nrouter.get('/:id', controller.getCourseById); // 추가\n// SELECT * FROM courses WHERE id = ? → price 포함 반환", {
    x: 5.45, y: 3.93, w: 3.85, h: 0.8, fontSize: 10.5, fontFace: 'Consolas', color: 'E2E8F0', valign: 'top', margin: 0,
  });
}

// ══════════════════════════════════════════
// SLIDE 5: P3 기능 개요
// ══════════════════════════════════════════
{
  const s = pres.addSlide();
  slideHeader(s, '02  P3 개발 기능 개요');

  const features = [
    { label: 'PAYMENT',   title: '결제 시스템',   desc: '강의 구매 처리\n결제 내역 / 환불',     c: C.accent2 },
    { label: 'NOTIFY',    title: '알림 시스템',   desc: '실시간 알림 발송\n읽음 / 미읽음 뱃지', c: C.accent  },
    { label: 'SETTLE',    title: '정산 관리',     desc: '강사 수익 정산\nCSV 내보내기',         c: C.warn    },
    { label: 'LOG',       title: '활동 로그',     desc: '사용자 행동 기록\n로그 조회 / 삭제',   c: C.purple  },
    { label: 'MONITOR',   title: '서버 모니터링', desc: '헬스 체크\n요청 통계 대시보드',        c: C.success },
    { label: 'COMMENT',   title: '강사 댓글 조회', desc: '본인 강의 댓글\n통합 뷰',            c: C.warn    },
    { label: 'AUTH',      title: '자동 로그아웃', desc: 'JWT 만료 감지\n보안 강화',             c: C.accent  },
  ];

  features.forEach((f, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = 0.42 + col * 2.36;
    const y = 0.95 + row * 2.08;

    s.addShape(pres.shapes.RECTANGLE, {
      x, y, w: 2.18, h: 1.88,
      fill: { color: C.bg_card }, line: { color: f.c, pt: 1.5 }, shadow: mkShadow(),
    });
    // 상단 컬러 바
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 2.18, h: 0.08, fill: { color: f.c }, line: { color: f.c } });

    // 라벨 칩
    s.addShape(pres.shapes.RECTANGLE, { x: x + 0.15, y: y + 0.2, w: 0.9, h: 0.32, fill: { color: f.c, transparency: 80 }, line: { color: f.c, pt: 1 } });
    s.addText(f.label, { x: x + 0.15, y: y + 0.2, w: 0.9, h: 0.32, fontSize: 9, bold: true, color: f.c, align: 'center', valign: 'middle', margin: 0 });

    s.addText(f.title, { x: x + 0.12, y: y + 0.65, w: 1.94, h: 0.36, fontSize: 13, bold: true, color: C.white, margin: 0 });
    s.addText(f.desc,  { x: x + 0.12, y: y + 1.06, w: 1.94, h: 0.7,  fontSize: 11, color: C.gray, margin: 0 });
  });
}

// ══════════════════════════════════════════
// SLIDE 6: 결제 시스템
// ══════════════════════════════════════════
{
  const s = pres.addSlide();
  slideHeader(s, '03  결제 시스템', C.accent2);

  // 좌측: 기능 목록
  const funcs = [
    { label: '강의 구매',     desc: '유료 강의 결제 처리 (카드 정보 입력)' },
    { label: '구매 내역 조회', desc: '본인의 결제 이력 목록 확인' },
    { label: '환불 처리',     desc: '결제 취소 및 환불 상태 관리' },
    { label: '구매 여부 확인', desc: '강의 접근 전 구매 여부를 체크하여 접근 제어' },
  ];

  funcs.forEach((f, i) => {
    const y = 0.95 + i * 1.08;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 0.55, y, w: 4.3, h: 0.9,
      fill: { color: C.bg_card }, line: { color: C.border, pt: 1 }, shadow: mkShadow(),
    });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y, w: 0.08, h: 0.9, fill: { color: C.accent2 }, line: { color: C.accent2 } });
    s.addText(f.label, { x: 0.78, y: y + 0.1,  w: 3.9, h: 0.3, fontSize: 13, bold: true, color: C.white, margin: 0 });
    s.addText(f.desc,  { x: 0.78, y: y + 0.46, w: 3.9, h: 0.3, fontSize: 11.5, color: C.gray, margin: 0 });
  });

  // 우측: 결제 흐름
  s.addShape(pres.shapes.RECTANGLE, { x: 5.15, y: 0.95, w: 4.3, h: 0.42, fill: { color: C.accent2, transparency: 85 }, line: { color: C.accent2, pt: 1 } });
  s.addText('결제 흐름', { x: 5.3, y: 0.95, w: 4.0, h: 0.42, fontSize: 13, bold: true, color: C.accent2, valign: 'middle', margin: 0 });

  const steps = [
    { n: '1', t: '구매하기 버튼 클릭',      d: '강의 상세 페이지에서 가격 확인 후 결제 시작' },
    { n: '2', t: '결제 정보 입력',          d: '카드번호 뒷 4자리 입력' },
    { n: '3', t: 'POST /api/payments',    d: '백엔드에서 결제 처리 및 DB 저장' },
    { n: '4', t: '구매 완료',              d: '구매 완료 표시 — 강의 수강 가능 상태로 전환' },
  ];
  steps.forEach((step, i) => {
    const y = 1.5 + i * 0.84;
    s.addShape(pres.shapes.RECTANGLE, {
      x: 5.15, y, w: 4.3, h: 0.72,
      fill: { color: C.bg_card }, line: { color: C.accent2, pt: 1 },
    });
    s.addShape(pres.shapes.RECTANGLE, { x: 5.15, y, w: 0.38, h: 0.72, fill: { color: C.accent2 }, line: { color: C.accent2 } });
    s.addText(step.n, { x: 5.15, y, w: 0.38, h: 0.72, fontSize: 14, bold: true, color: C.bg_dark, align: 'center', valign: 'middle', margin: 0 });
    s.addText(step.t, { x: 5.63, y: y + 0.06, w: 3.72, h: 0.28, fontSize: 12, bold: true, color: C.white, margin: 0 });
    s.addText(step.d, { x: 5.63, y: y + 0.38, w: 3.72, h: 0.26, fontSize: 10.5, color: C.gray, margin: 0 });
  });
}

// ══════════════════════════════════════════
// SLIDE 7: 알림 / 정산 / 로그 / 모니터링
// ══════════════════════════════════════════
{
  const s = pres.addSlide();
  slideHeader(s, '04  알림  /  정산  /  로그  /  모니터링', C.warn);

  const groups = [
    {
      label: 'NOTIFY', title: '알림 시스템', c: C.accent,
      items: ['전체 알림 목록 조회', '읽음 / 전체 읽음 처리', '미읽음 카운트 뱃지', '개별 알림 삭제'],
    },
    {
      label: 'SETTLE', title: '정산 관리', c: C.warn,
      items: ['강사 수익 정산 조회', '월별 통계 확인', '관리자 전체 정산 뷰', 'CSV 내보내기'],
    },
    {
      label: 'LOG', title: '활동 로그', c: C.purple,
      items: ['사용자 행동 로그 조회', '액션 필터 검색', '오래된 로그 일괄 삭제'],
    },
    {
      label: 'MONITOR', title: '서버 모니터링', c: C.success,
      items: ['서버 헬스 체크', '요청 수 / 에러율 통계', '평균 응답 시간 확인'],
    },
  ];

  groups.forEach((g, i) => {
    const x = 0.38 + i * 2.37;
    const cardH = 4.28;
    s.addShape(pres.shapes.RECTANGLE, {
      x, y: 0.95, w: 2.2, h: cardH,
      fill: { color: C.bg_card }, line: { color: g.c, pt: 1.5 }, shadow: mkShadow(),
    });
    // 상단 컬러 헤더
    s.addShape(pres.shapes.RECTANGLE, { x, y: 0.95, w: 2.2, h: 0.62, fill: { color: g.c, transparency: 75 }, line: { color: g.c, pt: 1.5 } });
    s.addText(g.label, { x: x + 0.12, y: 0.97, w: 1.0,  h: 0.28, fontSize: 9,  bold: true, color: g.c,    margin: 0 });
    s.addText(g.title, { x: x + 0.12, y: 1.22, w: 1.96, h: 0.28, fontSize: 12, bold: true, color: C.white, margin: 0 });

    // 구분선
    s.addShape(pres.shapes.RECTANGLE, { x: x + 0.15, y: 1.6, w: 1.9, h: 0.03, fill: { color: C.border }, line: { color: C.border } });

    g.items.forEach((item, j) => {
      const iy = 1.73 + j * 0.64;
      s.addShape(pres.shapes.RECTANGLE, { x: x + 0.15, y: iy + 0.18, w: 0.06, h: 0.06, fill: { color: g.c }, line: { color: g.c } });
      s.addText(item, { x: x + 0.3, y: iy, w: 1.78, h: 0.44, fontSize: 11, color: C.light, valign: 'middle', margin: 0 });
    });
  });
}

// ══════════════════════════════════════════
// SLIDE 8: 강사 댓글 조회 & 자동 로그아웃
// ══════════════════════════════════════════
{
  const s = pres.addSlide();
  slideHeader(s, '05  강사 댓글 조회  &  자동 로그아웃', C.purple);

  // ── 좌측: 강사 댓글 조회 ──
  s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y: 0.93, w: 4.35, h: 0.48, fill: { color: C.purple, transparency: 82 }, line: { color: C.purple, pt: 1 } });
  s.addText('강사 댓글 조회', { x: 0.72, y: 0.93, w: 4.0, h: 0.48, fontSize: 14, bold: true, color: C.purple, valign: 'middle', margin: 0 });

  const commentItems = [
    { t: '통합 댓글 뷰',      d: '본인 강의에 달린 수강생 댓글을 한 화면에서 모두 확인' },
    { t: '강의 정보 표시',    d: '어느 강의 / 어느 강의 영상의 댓글인지 함께 표시' },
    { t: '권한별 범위',       d: '관리자는 전체 강의 댓글, 강사는 본인 강의만 확인' },
    { t: '답글 포함 조회',    d: '수강생 댓글에 달린 답글도 함께 표시' },
  ];
  commentItems.forEach((f, i) => {
    const y = 1.55 + i * 0.88;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y, w: 4.35, h: 0.74, fill: { color: C.bg_card }, line: { color: C.border, pt: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.55, y, w: 0.08, h: 0.74, fill: { color: C.purple }, line: { color: C.purple } });
    s.addText(f.t, { x: 0.74, y: y + 0.07, w: 4.04, h: 0.27, fontSize: 12, bold: true, color: C.white, margin: 0 });
    s.addText(f.d, { x: 0.74, y: y + 0.38, w: 4.04, h: 0.28, fontSize: 11, color: C.gray, margin: 0 });
  });

  // 세로 구분선
  s.addShape(pres.shapes.RECTANGLE, { x: 4.98, y: 0.93, w: 0.04, h: 4.3, fill: { color: C.border }, line: { color: C.border } });

  // ── 우측: 자동 로그아웃 ──
  s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y: 0.93, w: 4.35, h: 0.48, fill: { color: C.success, transparency: 82 }, line: { color: C.success, pt: 1 } });
  s.addText('자동 로그아웃', { x: 5.27, y: 0.93, w: 4.0, h: 0.48, fontSize: 14, bold: true, color: C.success, valign: 'middle', margin: 0 });

  const logoutItems = [
    { t: '앱 초기화 시 즉시 검사',  d: '토큰 만료 감지 시 localStorage 삭제 후 /login 이동' },
    { t: '1분 주기 백그라운드 체크', d: 'setInterval로 탭을 열어둔 채로 만료될 때 자동 처리' },
    { t: 'API 401 응답 감지',       d: '서버 응답 401 시 handleUnauthorized() 즉시 호출' },
  ];
  logoutItems.forEach((f, i) => {
    const y = 1.55 + i * 1.17;
    s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y, w: 4.35, h: 1.0, fill: { color: C.bg_card }, line: { color: C.border, pt: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 5.1, y, w: 0.08, h: 1.0, fill: { color: C.success }, line: { color: C.success } });
    s.addText(f.t, { x: 5.29, y: y + 0.1,  w: 4.04, h: 0.3,  fontSize: 12, bold: true, color: C.white, margin: 0 });
    s.addText(f.d, { x: 5.29, y: y + 0.48, w: 4.04, h: 0.38, fontSize: 11, color: C.gray, margin: 0 });
  });
}

// ══════════════════════════════════════════
// SLIDE 9: 마무리
// ══════════════════════════════════════════
{
  const s = pres.addSlide();
  s.background = { color: C.bg_dark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.12, fill: { color: C.accent }, line: { color: C.accent } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.505, w: 10, h: 0.12, fill: { color: C.accent }, line: { color: C.accent } });

  s.addText('HOMEFIT', {
    x: 0.5, y: 1.2, w: 9, h: 1.0,
    fontSize: 60, bold: true, color: C.accent, fontFace: 'Arial Black', align: 'center', charSpacing: 6, margin: 0,
  });
  s.addText('감사합니다', {
    x: 0.5, y: 2.3, w: 9, h: 0.8,
    fontSize: 36, bold: true, color: C.white, align: 'center', fontFace: 'Arial', margin: 0,
  });
  s.addShape(pres.shapes.RECTANGLE, { x: 3.5, y: 3.22, w: 3.0, h: 0.05, fill: { color: C.accent }, line: { color: C.accent } });
  s.addText('P3 개발 보고서  |  홈트레이닝 플랫폼 HOMEFIT', {
    x: 0.5, y: 3.36, w: 9, h: 0.42, fontSize: 14, color: C.gray, align: 'center', margin: 0,
  });

  // 요약 뱃지
  const summary = [
    { label: '결제 / 알림 / 정산', c: C.accent2 },
    { label: '강사 댓글 조회',     c: C.purple  },
    { label: '자동 로그아웃',      c: C.success },
    { label: '트러블슈팅 2건 해결', c: C.warn   },
  ];
  summary.forEach((t, i) => {
    const x = 0.85 + i * 2.15;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 4.0, w: 2.0, h: 0.65, fill: { color: C.bg_card }, line: { color: t.c, pt: 1.5 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 4.0, w: 2.0, h: 0.06, fill: { color: t.c }, line: { color: t.c } });
    s.addText(t.label, { x, y: 4.06, w: 2.0, h: 0.59, fontSize: 12, bold: true, color: t.c, align: 'center', valign: 'middle', margin: 0 });
  });
}

pres.writeFile({ fileName: "C:/home_training_pj/.claude/worktrees/distracted-northcutt/homefit_p3_report.pptx" })
  .then(() => console.log("완료"))
  .catch(e => { console.error(e); process.exit(1); });
