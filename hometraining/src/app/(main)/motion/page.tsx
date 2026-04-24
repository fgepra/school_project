// src/app/(main)/motion/page.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── 타입 ──────────────────────────────────────────────────────
interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility?: number;
}

type ExerciseKey = 'free' | 'squat' | 'pushup' | 'plank';

interface AngleResult {
  label: string;
  angle: number;
  status: 'good' | 'warn' | 'bad' | 'idle';
  feedback: string;
}

// ─── 운동 정의 ────────────────────────────────────────────────
const EXERCISES: Record<ExerciseKey, { label: string; icon: string; desc: string; camTip?: string }> = {
  free:   { label: '자유 모드',  icon: '🦴', desc: '골격 감지만 표시합니다.' },
  squat:  { label: '스쿼트',    icon: '🏋️', desc: '무릎을 90° 가까이 굽혀보세요.',         camTip: '측면 촬영을 권장합니다. 정면보다 무릎 각도를 훨씬 정확하게 측정할 수 있습니다.' },
  pushup: { label: '푸시업',    icon: '💪', desc: '팔꿈치가 90°일 때 최저점입니다.',        camTip: '측면 촬영을 권장합니다. 팔꿈치 각도와 몸통 일직선 여부가 정확하게 감지됩니다.' },
  plank:  { label: '플랭크',    icon: '🔥', desc: '어깨·엉덩이·발목을 일직선으로 유지하세요.', camTip: '반드시 측면에서 촬영하세요. 정면에서는 몸통 각도를 감지할 수 없습니다.' },
};

// MediaPipe landmark 인덱스 (POSE_LANDMARKS)
const LM = {
  NOSE: 0,
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,    RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,    RIGHT_WRIST: 16,
  LEFT_HIP: 23,      RIGHT_HIP: 24,
  LEFT_KNEE: 25,     RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,    RIGHT_ANKLE: 28,
};

// ─── 유틸 ─────────────────────────────────────────────────────
/** 세 점 사이의 각도(°) 계산 — B가 꼭짓점 */
function calcAngle(A: Landmark, B: Landmark, C: Landmark): number {
  const radians =
    Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let deg = Math.abs((radians * 180) / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return Math.round(deg);
}

/** visibility 임계값 이상인지 확인 */
function visible(lm: Landmark, threshold = 0.5): boolean {
  return (lm.visibility ?? 1) >= threshold;
}

/** 각도 → 상태/피드백 */
function angleStatus(
  angle: number,
  goodMin: number,
  goodMax: number,
  warnMin: number,
  warnMax: number,
): 'good' | 'warn' | 'bad' {
  if (angle >= goodMin && angle <= goodMax) return 'good';
  if (angle >= warnMin && angle <= warnMax) return 'warn';
  return 'bad';
}

const STATUS_COLOR = { good: '#22c55e', warn: '#f59e0b', bad: '#ef4444', idle: 'var(--text-secondary)' };
const STATUS_BG    = { good: 'rgba(34,197,94,0.12)', warn: 'rgba(245,158,11,0.12)', bad: 'rgba(239,68,68,0.12)', idle: 'var(--bg-elevated)' };
const STATUS_LABEL = { good: '좋음', warn: '주의', bad: '수정 필요', idle: '—' };

// ─── 운동별 각도 분석 ──────────────────────────────────────────
function analyzeSquat(lm: Landmark[]): AngleResult[] {
  const results: AngleResult[] = [];

  // 왼쪽 무릎
  if (visible(lm[LM.LEFT_HIP]) && visible(lm[LM.LEFT_KNEE]) && visible(lm[LM.LEFT_ANKLE])) {
    const angle = calcAngle(lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE]);
    const status = angleStatus(angle, 80, 110, 60, 130);
    results.push({
      label: '왼쪽 무릎',
      angle,
      status,
      feedback:
        status === 'good' ? '좋은 자세입니다!'
        : angle < 80 ? '너무 깊게 앉았습니다. 조금 올라오세요.'
        : '더 깊이 앉아보세요. 목표는 90°입니다.',
    });
  }

  // 오른쪽 무릎
  if (visible(lm[LM.RIGHT_HIP]) && visible(lm[LM.RIGHT_KNEE]) && visible(lm[LM.RIGHT_ANKLE])) {
    const angle = calcAngle(lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE]);
    const status = angleStatus(angle, 80, 110, 60, 130);
    results.push({
      label: '오른쪽 무릎',
      angle,
      status,
      feedback:
        status === 'good' ? '좋은 자세입니다!'
        : angle < 80 ? '너무 깊게 앉았습니다. 조금 올라오세요.'
        : '더 깊이 앉아보세요. 목표는 90°입니다.',
    });
  }

  // 허리 직립도: 어깨-엉덩이-무릎 각도로 근사
  if (visible(lm[LM.LEFT_SHOULDER]) && visible(lm[LM.LEFT_HIP]) && visible(lm[LM.LEFT_KNEE])) {
    const angle = calcAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE]);
    const status = angleStatus(angle, 60, 120, 40, 150);
    results.push({
      label: '허리 자세',
      angle,
      status,
      feedback:
        status === 'good' ? '상체가 잘 유지되고 있습니다.'
        : '허리가 너무 앞으로 기울었습니다. 가슴을 펴고 시선을 앞으로 향하세요.',
    });
  }

  return results;
}

function analyzePushup(lm: Landmark[]): AngleResult[] {
  const results: AngleResult[] = [];

  // 왼쪽 팔꿈치
  if (visible(lm[LM.LEFT_SHOULDER]) && visible(lm[LM.LEFT_ELBOW]) && visible(lm[LM.LEFT_WRIST])) {
    const angle = calcAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_ELBOW], lm[LM.LEFT_WRIST]);
    const status = angleStatus(angle, 80, 110, 60, 150);
    results.push({
      label: '왼쪽 팔꿈치',
      angle,
      status,
      feedback:
        status === 'good' ? '팔꿈치 각도가 좋습니다!'
        : angle > 150 ? '팔을 더 굽혀보세요. 목표는 90°입니다.'
        : '너무 깊이 내려갔습니다. 조금 올라오세요.',
    });
  }

  // 오른쪽 팔꿈치
  if (visible(lm[LM.RIGHT_SHOULDER]) && visible(lm[LM.RIGHT_ELBOW]) && visible(lm[LM.RIGHT_WRIST])) {
    const angle = calcAngle(lm[LM.RIGHT_SHOULDER], lm[LM.RIGHT_ELBOW], lm[LM.RIGHT_WRIST]);
    const status = angleStatus(angle, 80, 110, 60, 150);
    results.push({
      label: '오른쪽 팔꿈치',
      angle,
      status,
      feedback:
        status === 'good' ? '팔꿈치 각도가 좋습니다!'
        : angle > 150 ? '팔을 더 굽혀보세요. 목표는 90°입니다.'
        : '너무 깊이 내려갔습니다. 조금 올라오세요.',
    });
  }

  // 몸통 직선도: 어깨-엉덩이-발목
  if (visible(lm[LM.LEFT_SHOULDER]) && visible(lm[LM.LEFT_HIP]) && visible(lm[LM.LEFT_ANKLE])) {
    const angle = calcAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_HIP], lm[LM.LEFT_ANKLE]);
    const status = angleStatus(angle, 160, 180, 140, 180);
    results.push({
      label: '몸통 일직선',
      angle,
      status,
      feedback:
        status === 'good' ? '몸이 일직선으로 잘 유지되고 있습니다.'
        : '엉덩이가 처지거나 올라가 있습니다. 몸을 일직선으로 유지하세요.',
    });
  }

  return results;
}

function analyzePlank(lm: Landmark[]): AngleResult[] {
  const results: AngleResult[] = [];

  // 몸통 직선도
  if (visible(lm[LM.LEFT_SHOULDER]) && visible(lm[LM.LEFT_HIP]) && visible(lm[LM.LEFT_ANKLE])) {
    const angle = calcAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_HIP], lm[LM.LEFT_ANKLE]);
    const status = angleStatus(angle, 160, 180, 140, 180);
    results.push({
      label: '몸통 정렬',
      angle,
      status,
      feedback:
        status === 'good' ? '완벽한 플랭크 자세입니다!'
        : '엉덩이가 처지거나 올라가 있습니다. 몸을 일직선으로 유지하세요.',
    });
  }

  // 팔꿈치 각도 (팔뚝 플랭크 확인)
  if (visible(lm[LM.LEFT_SHOULDER]) && visible(lm[LM.LEFT_ELBOW]) && visible(lm[LM.LEFT_WRIST])) {
    const angle = calcAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_ELBOW], lm[LM.LEFT_WRIST]);
    const status = angleStatus(angle, 80, 100, 60, 120);
    results.push({
      label: '팔꿈치 각도',
      angle,
      status,
      feedback:
        status === 'good' ? '팔꿈치 위치가 적절합니다.'
        : '팔꿈치를 어깨 바로 아래에 위치시키세요.',
    });
  }

  return results;
}

function analyzeExercise(exercise: ExerciseKey, lm: Landmark[]): AngleResult[] {
  if (!lm || lm.length < 29) return [];
  switch (exercise) {
    case 'squat':  return analyzeSquat(lm);
    case 'pushup': return analyzePushup(lm);
    case 'plank':  return analyzePlank(lm);
    default:       return [];
  }
}

// ─── 메인 컴포넌트 ─────────────────────────────────────────────
export default function MotionPage() {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cameraRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poseRef   = useRef<any>(null);

  const [exercise, setExercise]     = useState<ExerciseKey>('free');
  const [isActive, setIsActive]     = useState(false);
  const [isLoading, setIsLoading]   = useState(false);
  const [angles, setAngles]         = useState<AngleResult[]>([]);
  const [fps, setFps]               = useState(0);
  const [error, setError]           = useState('');
  const [poseDetected, setPoseDetected] = useState(false);

  const fpsCountRef  = useRef(0);
  const fpsTimerRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const exerciseRef  = useRef<ExerciseKey>('free');

  // exercise 상태를 ref에도 동기화 (onResults 클로저에서 최신 값 참조)
  useEffect(() => { exerciseRef.current = exercise; }, [exercise]);

  // ─── MediaPipe CDN 로드 ──────────────────────────────────────
  const loadMediaPipe = async () => {
    const scripts = [
      'https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3.1675466862/camera_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3.1675466124/drawing_utils.js',
      'https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js',
    ];
    for (const src of scripts) {
      await new Promise<void>((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src;
        s.crossOrigin = 'anonymous';
        s.onload = () => resolve();
        s.onerror = () => reject(new Error(`스크립트 로드 실패: ${src}`));
        document.head.appendChild(s);
      });
    }
  };

  // ─── MediaPipe 초기화 ────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsLoading(true);
    setError('');

    try {
      await loadMediaPipe();
      const w = window as any;
      const Pose             = w.Pose;
      const POSE_CONNECTIONS = w.POSE_CONNECTIONS;
      const Camera           = w.Camera;
      const drawConnectors   = w.drawConnectors;
      const drawLandmarks    = w.drawLandmarks;

      const pose = new Pose({
        locateFile: (file: string) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}`,
      });

      pose.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        smoothSegmentation: false,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      pose.onResults((results: any) => {
        const canvas  = canvasRef.current;
        const video   = videoRef.current;
        if (!canvas || !video) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // 캔버스 크기를 영상 크기에 맞춤
        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 480;

        // 좌우 반전된 영상 그리기
        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(results.image, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        const lm: Landmark[] = results.poseLandmarks ?? [];
        const detected = lm.length > 0;
        setPoseDetected(detected);

        if (detected) {
          // 좌우 반전 시 landmark x좌표도 반전
          const flipped = lm.map((p: Landmark) => ({ ...p, x: 1 - p.x }));

          // 연결선 그리기
          drawConnectors(ctx, flipped, POSE_CONNECTIONS, {
            color: 'rgba(0, 200, 255, 0.7)',
            lineWidth: 2,
          });

          // 관절 점 그리기
          drawLandmarks(ctx, flipped, {
            color: 'rgba(255, 80, 80, 0.9)',
            fillColor: 'rgba(255, 80, 80, 0.6)',
            lineWidth: 1,
            radius: 4,
          });

          // 주요 관절 위에 각도 텍스트 표시 (스쿼트)
          if (exerciseRef.current === 'squat') {
            const drawAngleAt = (lmIdx: number, angle: number) => {
              const p = flipped[lmIdx];
              if (!p || (p.visibility ?? 1) < 0.5) return;
              const px = p.x * canvas.width;
              const py = p.y * canvas.height;
              ctx.save();
              ctx.font = 'bold 14px sans-serif';
              ctx.fillStyle = '#ffffff';
              ctx.strokeStyle = 'rgba(0,0,0,0.6)';
              ctx.lineWidth = 3;
              const text = `${angle}°`;
              ctx.strokeText(text, px + 6, py - 6);
              ctx.fillText(text, px + 6, py - 6);
              ctx.restore();
            };

            const kneeLAngle = calcAngle(flipped[LM.LEFT_HIP],  flipped[LM.LEFT_KNEE],  flipped[LM.LEFT_ANKLE]);
            const kneeRAngle = calcAngle(flipped[LM.RIGHT_HIP], flipped[LM.RIGHT_KNEE], flipped[LM.RIGHT_ANKLE]);
            drawAngleAt(LM.LEFT_KNEE,  kneeLAngle);
            drawAngleAt(LM.RIGHT_KNEE, kneeRAngle);
          }

          if (exerciseRef.current === 'pushup') {
            const drawAngleAt = (lmIdx: number, angle: number) => {
              const p = flipped[lmIdx];
              if (!p || (p.visibility ?? 1) < 0.5) return;
              const px = p.x * canvas.width;
              const py = p.y * canvas.height;
              ctx.save();
              ctx.font = 'bold 14px sans-serif';
              ctx.fillStyle = '#ffffff';
              ctx.strokeStyle = 'rgba(0,0,0,0.6)';
              ctx.lineWidth = 3;
              const text = `${angle}°`;
              ctx.strokeText(text, px + 6, py - 6);
              ctx.fillText(text, px + 6, py - 6);
              ctx.restore();
            };

            const elbLAngle = calcAngle(flipped[LM.LEFT_SHOULDER],  flipped[LM.LEFT_ELBOW],  flipped[LM.LEFT_WRIST]);
            const elbRAngle = calcAngle(flipped[LM.RIGHT_SHOULDER], flipped[LM.RIGHT_ELBOW], flipped[LM.RIGHT_WRIST]);
            drawAngleAt(LM.LEFT_ELBOW,  elbLAngle);
            drawAngleAt(LM.RIGHT_ELBOW, elbRAngle);
          }

          // 분석 결과 업데이트
          const result = analyzeExercise(exerciseRef.current, flipped);
          setAngles(result);
        } else {
          setAngles([]);
        }

        fpsCountRef.current++;
      });

      poseRef.current = pose;

      const camera = new Camera(videoRef.current, {
        onFrame: async () => {
          if (poseRef.current && videoRef.current) {
            await poseRef.current.send({ image: videoRef.current });
          }
        },
        width: 640,
        height: 480,
      });

      await camera.start();
      cameraRef.current = camera;

      // FPS 카운터
      fpsTimerRef.current = setInterval(() => {
        setFps(fpsCountRef.current);
        fpsCountRef.current = 0;
      }, 1000);

      setIsActive(true);
    } catch (e) {
      setError('카메라 또는 MediaPipe 초기화에 실패했습니다. 카메라 권한을 허용해 주세요.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    cameraRef.current?.stop();
    cameraRef.current = null;
    poseRef.current   = null;
    if (fpsTimerRef.current) clearInterval(fpsTimerRef.current);

    // 캔버스 초기화
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }

    setIsActive(false);
    setAngles([]);
    setFps(0);
    setPoseDetected(false);
  }, []);

  // 언마운트 시 정리
  useEffect(() => () => { stopCamera(); }, [stopCamera]);

  // ─── 렌더 ─────────────────────────────────────────────────────
  const overallStatus: 'good' | 'warn' | 'bad' | 'idle' =
    angles.length === 0 ? 'idle'
    : angles.some(a => a.status === 'bad')  ? 'bad'
    : angles.some(a => a.status === 'warn') ? 'warn'
    : 'good';

  return (
    <div className="fade-in">
      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>모션 캡처</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
          웹캠으로 실시간 자세를 분석합니다. MediaPipe Pose 기반으로 33개 관절을 감지합니다.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, alignItems: 'start' }}>

        {/* ── 왼쪽: 카메라 영역 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 영상 + 캔버스 오버레이 */}
          <div
            className="card"
            style={{
              padding: 0,
              overflow: 'hidden',
              position: 'relative',
              background: '#0a0a0a',
              aspectRatio: '4/3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* 숨겨진 원본 비디오 */}
            <video
              ref={videoRef}
              style={{ display: 'none' }}
              autoPlay
              playsInline
              muted
            />

            {/* 처리된 영상이 그려지는 캔버스 */}
            <canvas
              ref={canvasRef}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: isActive ? 'block' : 'none',
              }}
            />

            {/* 비활성 상태 플레이스홀더 */}
            {!isActive && !isLoading && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📷</div>
                <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
                  카메라를 시작하면 실시간으로<br />골격을 감지합니다
                </p>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  카메라 권한 허용이 필요합니다
                </p>
              </div>
            )}

            {isLoading && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <div className="spinner" style={{ marginBottom: 16 }} />
                <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                  MediaPipe 모델 로딩 중...
                </p>
              </div>
            )}

            {/* 상태 오버레이 배지 */}
            {isActive && (
              <div style={{
                position: 'absolute', top: 12, left: 12,
                display: 'flex', gap: 8, flexWrap: 'wrap',
              }}>
                {/* 녹화 표시 */}
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '4px 10px', borderRadius: 20,
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                  fontSize: 12, color: '#ef4444', fontWeight: 700,
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: '#ef4444',
                    animation: 'pulse 1.5s ease-in-out infinite',
                  }} />
                  LIVE
                </span>

                {/* FPS */}
                <span style={{
                  padding: '4px 10px', borderRadius: 20,
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                  fontSize: 12, color: 'var(--text-secondary)',
                }}>
                  {fps} fps
                </span>

                {/* 감지 상태 */}
                <span style={{
                  padding: '4px 10px', borderRadius: 20,
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
                  fontSize: 12,
                  color: poseDetected ? '#22c55e' : '#f59e0b',
                }}>
                  {poseDetected ? '🟢 감지됨' : '🟡 인식 중...'}
                </span>
              </div>
            )}

            {/* 전체 자세 상태 오버레이 */}
            {isActive && angles.length > 0 && (
              <div style={{
                position: 'absolute', top: 12, right: 12,
                padding: '6px 14px', borderRadius: 20,
                background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                fontSize: 13, fontWeight: 700,
                color: STATUS_COLOR[overallStatus],
              }}>
                {overallStatus === 'good' ? '✅ 좋은 자세'
                : overallStatus === 'warn' ? '⚠️ 확인 필요'
                : '❌ 자세 교정'}
              </div>
            )}
          </div>

          {/* 에러 */}
          {error && (
            <div style={{
              padding: '12px 16px', borderRadius: 10,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              fontSize: 13, color: '#ef4444',
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* 시작 / 정지 버튼 */}
          <button
            onClick={isActive ? stopCamera : startCamera}
            disabled={isLoading}
            style={{
              padding: '14px',
              borderRadius: 10,
              border: 'none',
              background: isActive ? 'rgba(239,68,68,0.15)' : 'var(--accent)',
              color: isActive ? '#ef4444' : '#fff',
              fontSize: 15,
              fontWeight: 700,
              cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.6 : 1,
              transition: 'all 0.15s',
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            {isLoading ? '로딩 중...'
            : isActive  ? '⏹ 카메라 정지'
            :              '▶ 카메라 시작'}
          </button>
        </div>

        {/* ── 오른쪽: 사이드바 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* 운동 선택 */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>
              운동 선택
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(Object.entries(EXERCISES) as [ExerciseKey, typeof EXERCISES[ExerciseKey]][]).map(([key, ex]) => (
                <button
                  key={key}
                  onClick={() => { setExercise(key); setAngles([]); }}
                  style={{
                    padding: '10px 14px',
                    borderRadius: 8,
                    border: `1px solid ${exercise === key ? 'var(--accent)' : 'var(--border)'}`,
                    background: exercise === key ? 'var(--accent-dim)' : 'transparent',
                    color: exercise === key ? 'var(--accent)' : 'var(--text-primary)',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 13,
                    fontWeight: exercise === key ? 700 : 400,
                    fontFamily: "'Noto Sans KR', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    transition: 'all 0.15s',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{ex.icon}</span>
                  <div>
                    <div>{ex.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400, marginTop: 2 }}>
                      {ex.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* 카메라 촬영 각도 안내 */}
            {EXERCISES[exercise].camTip && (
              <div style={{
                marginTop: 12,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'rgba(245,158,11,0.1)',
                border: '1px solid rgba(245,158,11,0.3)',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}>
                <span style={{ fontSize: 15, flexShrink: 0 }}>📐</span>
                <p style={{ fontSize: 12, color: '#f59e0b', lineHeight: 1.6, margin: 0 }}>
                  {EXERCISES[exercise].camTip}
                </p>
              </div>
            )}
          </div>

          {/* 각도 분석 결과 */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>
              실시간 각도 분석
            </h3>

            {exercise === 'free' ? (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                운동을 선택하면 해당 자세에 맞는 각도 분석이 표시됩니다.
              </p>
            ) : !isActive ? (
              <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                카메라를 시작하면 분석이 시작됩니다.
              </p>
            ) : angles.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  전신이 카메라에 보이도록<br />위치를 조정해 주세요.
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {angles.map((a, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 10,
                      background: STATUS_BG[a.status],
                      border: `1px solid ${STATUS_COLOR[a.status]}30`,
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 6,
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{a.label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{
                          fontSize: 18, fontWeight: 700,
                          color: STATUS_COLOR[a.status],
                        }}>
                          {a.angle}°
                        </span>
                        <span style={{
                          fontSize: 11, fontWeight: 600,
                          color: STATUS_COLOR[a.status],
                          background: `${STATUS_COLOR[a.status]}20`,
                          padding: '2px 8px', borderRadius: 20,
                        }}>
                          {STATUS_LABEL[a.status]}
                        </span>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                      {a.feedback}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 사용 안내 */}
          <div className="card" style={{ padding: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 12, color: 'var(--text-secondary)' }}>
              사용 안내
            </h3>
            <ul style={{
              fontSize: 12, color: 'var(--text-secondary)',
              lineHeight: 1.9, paddingLeft: 16, margin: 0,
            }}>
              <li>전신이 카메라에 보이도록 2~3m 거리를 유지하세요.</li>
              <li>밝은 곳에서 사용하면 인식률이 높아집니다.</li>
              <li>단색 배경에서 더 잘 동작합니다.</li>
              <li>영상은 서버로 전송되지 않습니다.</li>
            </ul>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
