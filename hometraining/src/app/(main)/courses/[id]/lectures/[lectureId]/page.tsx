// src/app/(main)/courses/[id]/lectures/[lectureId]/page.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { courseApi, lectureApi, commentApi, workoutApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { MOCK_LECTURES } from '@/lib/mockData';
import { Lecture, Comment } from '@/types';

// ─── 유틸 ────────────────────────────────────────────────────
function formatTime(totalSec: number): string {
  const t = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(t / 60);
  const s = t % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function parseMmSs(str: string): number {
  const parts = str.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

// ─── 모션 캡처 타입 ──────────────────────────────────────────
interface Landmark { x: number; y: number; z: number; visibility?: number; }
type ExerciseKey = 'free' | 'squat' | 'pushup' | 'plank';
interface AngleResult { label: string; angle: number; status: 'good' | 'warn' | 'bad' | 'idle'; feedback: string; }

const EXERCISES: Record<ExerciseKey, { label: string; icon: string }> = {
  free:   { label: '자유 모드', icon: '🦴' },
  squat:  { label: '스쿼트',   icon: '🏋️' },
  pushup: { label: '푸시업',   icon: '💪' },
  plank:  { label: '플랭크',   icon: '🔥' },
};

const LM = {
  LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
  LEFT_ELBOW: 13,    RIGHT_ELBOW: 14,
  LEFT_WRIST: 15,    RIGHT_WRIST: 16,
  LEFT_HIP: 23,      RIGHT_HIP: 24,
  LEFT_KNEE: 25,     RIGHT_KNEE: 26,
  LEFT_ANKLE: 27,    RIGHT_ANKLE: 28,
};

const STATUS_COLOR = { good: '#22c55e', warn: '#f59e0b', bad: '#ef4444', idle: 'var(--text-secondary)' };
const STATUS_BG    = { good: 'rgba(34,197,94,0.12)', warn: 'rgba(245,158,11,0.12)', bad: 'rgba(239,68,68,0.12)', idle: 'var(--bg-elevated)' };
const STATUS_LABEL = { good: '좋음', warn: '주의', bad: '수정 필요', idle: '—' };

function calcAngle(A: Landmark, B: Landmark, C: Landmark): number {
  const rad = Math.atan2(C.y - B.y, C.x - B.x) - Math.atan2(A.y - B.y, A.x - B.x);
  let deg = Math.abs((rad * 180) / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return Math.round(deg);
}
function visible(lm: Landmark, t = 0.5): boolean { return (lm.visibility ?? 1) >= t; }
function angleStatus(angle: number, goodMin: number, goodMax: number, warnMin: number, warnMax: number): 'good' | 'warn' | 'bad' {
  if (angle >= goodMin && angle <= goodMax) return 'good';
  if (angle >= warnMin && angle <= warnMax) return 'warn';
  return 'bad';
}

function analyzeSquat(lm: Landmark[]): AngleResult[] {
  const results: AngleResult[] = [];
  if (visible(lm[LM.LEFT_HIP]) && visible(lm[LM.LEFT_KNEE]) && visible(lm[LM.LEFT_ANKLE])) {
    const angle = calcAngle(lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE]);
    const status = angleStatus(angle, 80, 110, 60, 130);
    results.push({ label: '왼쪽 무릎', angle, status, feedback: status === 'good' ? '좋은 자세!' : angle < 80 ? '조금 올라오세요.' : '더 깊이 앉아보세요.' });
  }
  if (visible(lm[LM.RIGHT_HIP]) && visible(lm[LM.RIGHT_KNEE]) && visible(lm[LM.RIGHT_ANKLE])) {
    const angle = calcAngle(lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE]);
    const status = angleStatus(angle, 80, 110, 60, 130);
    results.push({ label: '오른쪽 무릎', angle, status, feedback: status === 'good' ? '좋은 자세!' : angle < 80 ? '조금 올라오세요.' : '더 깊이 앉아보세요.' });
  }
  return results;
}

function analyzePushup(lm: Landmark[]): AngleResult[] {
  const results: AngleResult[] = [];
  if (visible(lm[LM.LEFT_SHOULDER]) && visible(lm[LM.LEFT_ELBOW]) && visible(lm[LM.LEFT_WRIST])) {
    const angle = calcAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_ELBOW], lm[LM.LEFT_WRIST]);
    const status = angleStatus(angle, 80, 110, 60, 150);
    results.push({ label: '왼쪽 팔꿈치', angle, status, feedback: status === 'good' ? '좋습니다!' : angle > 150 ? '팔을 더 굽혀보세요.' : '조금 올라오세요.' });
  }
  if (visible(lm[LM.RIGHT_SHOULDER]) && visible(lm[LM.RIGHT_ELBOW]) && visible(lm[LM.RIGHT_WRIST])) {
    const angle = calcAngle(lm[LM.RIGHT_SHOULDER], lm[LM.RIGHT_ELBOW], lm[LM.RIGHT_WRIST]);
    const status = angleStatus(angle, 80, 110, 60, 150);
    results.push({ label: '오른쪽 팔꿈치', angle, status, feedback: status === 'good' ? '좋습니다!' : angle > 150 ? '팔을 더 굽혀보세요.' : '조금 올라오세요.' });
  }
  if (visible(lm[LM.LEFT_SHOULDER]) && visible(lm[LM.LEFT_HIP]) && visible(lm[LM.LEFT_ANKLE])) {
    const angle = calcAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_HIP], lm[LM.LEFT_ANKLE]);
    const status = angleStatus(angle, 160, 180, 140, 180);
    results.push({ label: '몸통 일직선', angle, status, feedback: status === 'good' ? '완벽합니다!' : '몸을 일직선으로 유지하세요.' });
  }
  return results;
}

function analyzePlank(lm: Landmark[]): AngleResult[] {
  const results: AngleResult[] = [];
  if (visible(lm[LM.LEFT_SHOULDER]) && visible(lm[LM.LEFT_HIP]) && visible(lm[LM.LEFT_ANKLE])) {
    const angle = calcAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_HIP], lm[LM.LEFT_ANKLE]);
    const status = angleStatus(angle, 160, 180, 140, 180);
    results.push({ label: '몸통 정렬', angle, status, feedback: status === 'good' ? '완벽한 플랭크!' : '몸을 일직선으로 유지하세요.' });
  }
  if (visible(lm[LM.LEFT_SHOULDER]) && visible(lm[LM.LEFT_ELBOW]) && visible(lm[LM.LEFT_WRIST])) {
    const angle = calcAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_ELBOW], lm[LM.LEFT_WRIST]);
    const status = angleStatus(angle, 80, 100, 60, 120);
    results.push({ label: '팔꿈치 각도', angle, status, feedback: status === 'good' ? '위치 좋습니다.' : '팔꿈치를 어깨 아래에 위치시키세요.' });
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

// ─── 메인 컴포넌트 ───────────────────────────────────────────
export default function LectureWatchPage() {
  const { id: courseId, lectureId } = useParams<{ id: string; lectureId: string }>();
  const { user, isInstructor } = useAuth();
  const { getProgress, saveProgress } = useProgress(user?.id ?? null);

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 시청 시간 입력
  const [watchInputStr, setWatchInputStr] = useState('');
  const [inputError, setInputError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // 운동 기록 저장
  const [workoutSaving, setWorkoutSaving] = useState(false);
  const [workoutResult, setWorkoutResult] = useState<{ calories: number } | null>(null);

  // 댓글 상태
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState('');
  const [editCommentLoading, setEditCommentLoading] = useState(false);

  // ─── 모션 캡처 상태 ──────────────────────────────────────────
  const [motionOpen, setMotionOpen] = useState(false);
  const [motionExercise, setMotionExercise] = useState<ExerciseKey>('free');
  const [motionActive, setMotionActive] = useState(false);
  const [motionLoading, setMotionLoading] = useState(false);
  const [motionError, setMotionError] = useState('');
  const [motionAngles, setMotionAngles] = useState<AngleResult[]>([]);
  const [motionFps, setMotionFps] = useState(0);
  const [poseDetected, setPoseDetected] = useState(false);

  const videoRef    = useRef<HTMLVideoElement>(null);
  const canvasRef   = useRef<HTMLCanvasElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cameraRef   = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const poseRef     = useRef<any>(null);
  const fpsCountRef = useRef(0);
  const fpsTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const exerciseRef = useRef<ExerciseKey>('free');

  useEffect(() => { exerciseRef.current = motionExercise; }, [motionExercise]);

  // ─── 데이터 로드 ─────────────────────────────────────────────
  useEffect(() => {
    const lid = Number(lectureId);
    const cid = Number(courseId);
    const mockAll = MOCK_LECTURES[cid] ?? [];

    const fetchLecture = lectureApi.getById(lid).catch(() =>
      mockAll.find((l) => l.id === lid) ?? null
    );
    const fetchAll = courseApi.getLectures(cid).catch(() => mockAll);

    Promise.all([fetchLecture, fetchAll])
      .then(([l, all]) => {
        const mockLecture = mockAll.find((m) => m.id === lid);
        const mergedLecture = l
          ? { ...l, video_url: l.video_url || mockLecture?.video_url || '' }
          : mockLecture ?? null;

        const mergedAll = (all.length > 0 ? all : mockAll).map((item) => {
          const mock = mockAll.find((m) => m.id === item.id);
          return { ...item, video_url: item.video_url || mock?.video_url || '' };
        });

        setLecture(mergedLecture);
        setAllLectures(mergedAll);
      })
      .catch(() => {
        setLecture(mockAll.find((l) => l.id === lid) ?? null);
        setAllLectures(mockAll);
      })
      .finally(() => setIsLoading(false));
  }, [lectureId, courseId]);

  useEffect(() => {
    if (!user) return;
    commentApi.getByLecture(Number(lectureId))
      .then(setComments)
      .catch(console.error);
  }, [lectureId, user]);

  useEffect(() => {
    if (!lecture) return;
    const prog = getProgress(lecture.id);
    if (prog && prog.watched_time > 0) {
      setWatchInputStr(formatTime(prog.watched_time));
    } else {
      setWatchInputStr('');
    }
    setInputError('');
    setIsSaved(false);
    setWorkoutResult(null);
  }, [lecture?.id]);

  // ─── 진도 저장 ───────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!lecture) return;
    const watchedSec = parseMmSs(watchInputStr);
    if (watchInputStr.trim() !== '' && !/^\d+:\d{2}$/.test(watchInputStr.trim())) {
      setInputError('MM:SS 형식으로 입력해 주세요 (예: 7:30)');
      return;
    }
    const clampedSec = Math.min(watchedSec, lecture.duration);
    const completed = lecture.duration > 0 && clampedSec / lecture.duration >= 0.9;
    try {
      await saveProgress(lecture.id, clampedSec, completed);
      setIsSaved(true);
      setInputError('');
      setTimeout(() => setIsSaved(false), 2500);
    } catch {
      setInputError('저장에 실패했습니다.');
    }
  }, [lecture, watchInputStr, saveProgress]);

  const handleMarkComplete = useCallback(async () => {
    if (!lecture) return;
    setWatchInputStr(formatTime(lecture.duration));
    try {
      await saveProgress(lecture.id, lecture.duration, true);
      setIsSaved(true);
      setInputError('');
      setTimeout(() => setIsSaved(false), 2500);
    } catch {
      setInputError('저장에 실패했습니다.');
    }
  }, [lecture, saveProgress]);

  // ─── 운동 기록 저장 ──────────────────────────────────────────
  const handleSaveWorkout = useCallback(async () => {
    if (!lecture || !user) return;
    const watchedSec = parseMmSs(watchInputStr);
    if (watchedSec <= 0) {
      setInputError('시청 시간을 먼저 입력해 주세요.');
      return;
    }
    setWorkoutSaving(true);
    try {
      const result = await workoutApi.save({
        lecture_id: lecture.id,
        course_id: Number(courseId),
        duration_sec: Math.min(watchedSec, lecture.duration),
      });
      setWorkoutResult({ calories: result.calories_burned });
    } catch {
      setInputError('운동 기록 저장에 실패했습니다.');
    } finally {
      setWorkoutSaving(false);
    }
  }, [lecture, watchInputStr, courseId, user]);

  // ─── 댓글 핸들러 ────────────────────────────────────────────
  const handleAddComment = async () => {
    if (!commentText.trim() || commentLoading) return;
    setCommentLoading(true);
    try {
      const newComment = await commentApi.create(Number(lectureId), commentText.trim());
      setComments((prev) => [...prev, newComment]);
      setCommentText('');
    } catch (err) {
      alert(err instanceof Error ? err.message : '댓글 작성에 실패했습니다.');
    } finally {
      setCommentLoading(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    try {
      await commentApi.delete(commentId);
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  const handleStartEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditCommentText(comment.content);
  };

  const handleUpdateComment = async (commentId: number) => {
    if (!editCommentText.trim() || editCommentLoading) return;
    setEditCommentLoading(true);
    try {
      const updated = await commentApi.updateComment(commentId, editCommentText.trim());
      setComments((prev) =>
        prev.map((c) => c.id === commentId ? { ...c, content: updated.content } : c)
      );
      setEditingCommentId(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '수정에 실패했습니다.');
    } finally {
      setEditCommentLoading(false);
    }
  };

  const handleAddReply = async (commentId: number) => {
    if (!replyText.trim() || replyLoading) return;
    setReplyLoading(true);
    try {
      const newReply = await commentApi.createReply(commentId, replyText.trim());
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId ? { ...c, replies: [...(c.replies ?? []), newReply] } : c
        )
      );
      setReplyText('');
      setReplyingTo(null);
    } catch (err) {
      alert(err instanceof Error ? err.message : '답글 작성에 실패했습니다.');
    } finally {
      setReplyLoading(false);
    }
  };

  const handleDeleteReply = async (commentId: number, replyId: number) => {
    if (!window.confirm('답글을 삭제하시겠습니까?')) return;
    try {
      await commentApi.deleteReply(replyId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, replies: (c.replies ?? []).filter((r) => r.id !== replyId) }
            : c
        )
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    }
  };

  // ─── CDN 스크립트 로더 ───────────────────────────────────────
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

  // ─── 모션 캡처 ───────────────────────────────────────────────
  const startMotion = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;
    setMotionLoading(true);
    setMotionError('');
    try {
      await loadMediaPipe();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const Pose = w.Pose;
      const POSE_CONNECTIONS = w.POSE_CONNECTIONS;
      const Camera = w.Camera;
      const drawConnectors = w.drawConnectors;
      const drawLandmarks = w.drawLandmarks;

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pose.onResults((results: any) => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width  = video.videoWidth  || 640;
        canvas.height = video.videoHeight || 480;

        ctx.save();
        ctx.scale(-1, 1);
        ctx.drawImage(results.image, -canvas.width, 0, canvas.width, canvas.height);
        ctx.restore();

        const lm: Landmark[] = results.poseLandmarks ?? [];
        const detected = lm.length > 0;
        setPoseDetected(detected);

        if (detected) {
          const flipped = lm.map((p: Landmark) => ({ ...p, x: 1 - p.x }));
          drawConnectors(ctx, flipped, POSE_CONNECTIONS, { color: 'rgba(0,200,255,0.7)', lineWidth: 2 });
          drawLandmarks(ctx, flipped, { color: 'rgba(255,80,80,0.9)', fillColor: 'rgba(255,80,80,0.6)', lineWidth: 1, radius: 3 });

          const angleAt = (lmIdx: number, angle: number) => {
            const p = flipped[lmIdx];
            if (!p || (p.visibility ?? 1) < 0.5) return;
            const px = p.x * canvas.width;
            const py = p.y * canvas.height;
            ctx.save();
            ctx.font = 'bold 13px sans-serif';
            ctx.fillStyle = '#fff';
            ctx.strokeStyle = 'rgba(0,0,0,0.6)';
            ctx.lineWidth = 3;
            ctx.strokeText(`${angle}°`, px + 5, py - 5);
            ctx.fillText(`${angle}°`, px + 5, py - 5);
            ctx.restore();
          };

          if (exerciseRef.current === 'squat') {
            angleAt(LM.LEFT_KNEE,  calcAngle(flipped[LM.LEFT_HIP],  flipped[LM.LEFT_KNEE],  flipped[LM.LEFT_ANKLE]));
            angleAt(LM.RIGHT_KNEE, calcAngle(flipped[LM.RIGHT_HIP], flipped[LM.RIGHT_KNEE], flipped[LM.RIGHT_ANKLE]));
          }
          if (exerciseRef.current === 'pushup') {
            angleAt(LM.LEFT_ELBOW,  calcAngle(flipped[LM.LEFT_SHOULDER],  flipped[LM.LEFT_ELBOW],  flipped[LM.LEFT_WRIST]));
            angleAt(LM.RIGHT_ELBOW, calcAngle(flipped[LM.RIGHT_SHOULDER], flipped[LM.RIGHT_ELBOW], flipped[LM.RIGHT_WRIST]));
          }

          setMotionAngles(analyzeExercise(exerciseRef.current, flipped));
        } else {
          setMotionAngles([]);
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

      fpsTimerRef.current = setInterval(() => {
        setMotionFps(fpsCountRef.current);
        fpsCountRef.current = 0;
      }, 1000);

      setMotionActive(true);
    } catch (e) {
      setMotionError('카메라 또는 MediaPipe 초기화에 실패했습니다.');
      console.error(e);
    } finally {
      setMotionLoading(false);
    }
  }, []);

  const stopMotion = useCallback(() => {
    cameraRef.current?.stop();
    cameraRef.current = null;
    poseRef.current = null;
    if (fpsTimerRef.current) clearInterval(fpsTimerRef.current);
    const canvas = canvasRef.current;
    if (canvas) canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
    setMotionActive(false);
    setMotionAngles([]);
    setMotionFps(0);
    setPoseDetected(false);
  }, []);

  useEffect(() => () => { stopMotion(); }, [stopMotion]);

  const handleMotionToggle = () => {
    if (motionOpen && motionActive) stopMotion();
    setMotionOpen((v) => !v);
  };

  // ─── 이전 / 다음 강의 ────────────────────────────────────────
  const currentIndex = allLectures.findIndex((l) => l.id === Number(lectureId));
  const prevLecture = currentIndex > 0 ? allLectures[currentIndex - 1] : null;
  const nextLecture = currentIndex < allLectures.length - 1 ? allLectures[currentIndex + 1] : null;

  const activeItemRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    activeItemRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [lectureId]);

  // ─── 로딩 / 에러 ─────────────────────────────────────────────
  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }
  if (!lecture) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
        강의를 찾을 수 없습니다.
      </div>
    );
  }

  const progress = getProgress(lecture.id);
  const watchedSec = parseMmSs(watchInputStr);
  const savedSec = progress?.watched_time ?? 0;
  const progressRate = lecture.duration > 0 ? Math.min((savedSec / lecture.duration) * 100, 100) : 0;
  const isCompleted = progress?.completed ?? false;

  const overallStatus: 'good' | 'warn' | 'bad' | 'idle' =
    motionAngles.length === 0 ? 'idle'
    : motionAngles.some(a => a.status === 'bad')  ? 'bad'
    : motionAngles.some(a => a.status === 'warn') ? 'warn'
    : 'good';

  return (
    <div className="fade-in" style={{ maxWidth: '100%' }}>
      {/* 뒤로가기 */}
      <Link
        href={`/courses/${courseId}`}
        style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}
      >
        ← 강의 목록으로
      </Link>

      {/* ── 7 : 3 메인 레이아웃 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 3fr', gap: 20, alignItems: 'start' }}>

        {/* ── 왼쪽: 강의 콘텐츠 영역 ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* ① 강의 제목 + 메타 */}
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 6 }}>{lecture.title}</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {currentIndex + 1} / {allLectures.length}강 &nbsp;·&nbsp; 총 영상 시간 {formatTime(lecture.duration)}
              {isCompleted && (
                <span style={{ marginLeft: 10, fontSize: 12, color: 'var(--green)', background: 'rgba(34,197,94,0.12)', padding: '2px 8px', borderRadius: 20 }}>
                  ✅ 수강 완료
                </span>
              )}
            </p>
          </div>

          {/* ② 유튜브 카드 + 모션 캡처 토글 */}
          <div
            className="card"
            style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}
          >
            {/* 헤더 행: 제목 + 모션 캡처 토글 버튼 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 14, fontWeight: 700 }}>유튜브에서 강의 영상 시청하기</p>
              <button
                onClick={handleMotionToggle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 14px',
                  borderRadius: 8,
                  border: `1px solid ${motionOpen ? 'var(--accent)' : 'var(--border)'}`,
                  background: motionOpen ? 'var(--accent-dim)' : 'transparent',
                  color: motionOpen ? 'var(--accent)' : 'var(--text-secondary)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                📷 모션 캡처 {motionOpen ? 'ON' : 'OFF'}
              </button>
            </div>

            {/* 유튜브 링크 버튼 */}
            <div style={{ textAlign: 'center' }}>
              {lecture.video_url ? (
                <a
                  href={lecture.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '11px 24px', borderRadius: 10, background: '#FF0000',
                    color: '#fff', fontSize: 14, fontWeight: 700, textDecoration: 'none',
                    transition: 'opacity 0.15s',
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                  onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
                >
                  <svg width="20" height="14" viewBox="0 0 22 16" fill="none">
                    <path d="M21.543 2.5A2.75 2.75 0 0019.6.55C17.9 0 11 0 11 0S4.1 0 2.4.55A2.75 2.75 0 00.457 2.5 29 29 0 000 8a29 29 0 00.457 5.5A2.75 2.75 0 002.4 15.45C4.1 16 11 16 11 16s6.9 0 8.6-.55a2.75 2.75 0 001.943-1.95A29 29 0 0022 8a29 29 0 00-.457-5.5z" fill="#fff"/>
                    <path d="M8.8 11.4V4.6L14.6 8l-5.8 3.4z" fill="#FF0000"/>
                  </svg>
                  유튜브에서 영상 보기
                </a>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'inline-block' }}>
                  🎬 아직 영상 URL이 등록되지 않은 강의입니다
                </div>
              )}
            </div>

            {/* 모션 캡처 패널 */}
            {motionOpen && (
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: 14 }}>

                  {/* 웹캠 캔버스 */}
                  <div style={{ position: 'relative', background: '#0a0a0a', borderRadius: 10, overflow: 'hidden', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <video ref={videoRef} style={{ display: 'none' }} autoPlay playsInline muted />
                    <canvas
                      ref={canvasRef}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: motionActive ? 'block' : 'none' }}
                    />
                    {!motionActive && !motionLoading && (
                      <div style={{ textAlign: 'center', padding: 24 }}>
                        <div style={{ fontSize: 40, marginBottom: 10 }}>📷</div>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>카메라를 시작하면<br />실시간 골격을 감지합니다</p>
                      </div>
                    )}
                    {motionLoading && (
                      <div style={{ textAlign: 'center', padding: 24 }}>
                        <div className="spinner" style={{ marginBottom: 10 }} />
                        <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>모델 로딩 중...</p>
                      </div>
                    )}

                    {/* 오버레이 배지들 */}
                    {motionActive && (
                      <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: 'rgba(0,0,0,0.6)', fontSize: 11, color: '#ef4444', fontWeight: 700 }}>
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1.5s infinite' }} />
                          LIVE
                        </span>
                        <span style={{ padding: '3px 8px', borderRadius: 20, background: 'rgba(0,0,0,0.6)', fontSize: 11, color: 'var(--text-secondary)' }}>
                          {motionFps}fps
                        </span>
                        <span style={{ padding: '3px 8px', borderRadius: 20, background: 'rgba(0,0,0,0.6)', fontSize: 11, color: poseDetected ? '#22c55e' : '#f59e0b' }}>
                          {poseDetected ? '🟢 감지됨' : '🟡 인식 중...'}
                        </span>
                      </div>
                    )}

                    {motionActive && motionAngles.length > 0 && (
                      <div style={{ position: 'absolute', top: 8, right: 8, padding: '4px 10px', borderRadius: 20, background: 'rgba(0,0,0,0.65)', fontSize: 11, fontWeight: 700, color: STATUS_COLOR[overallStatus] }}>
                        {overallStatus === 'good' ? '✅ 좋은 자세' : overallStatus === 'warn' ? '⚠️ 확인 필요' : '❌ 교정 필요'}
                      </div>
                    )}
                  </div>

                  {/* 오른쪽: 운동 선택 + 각도 분석 */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {/* 운동 선택 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(Object.entries(EXERCISES) as [ExerciseKey, typeof EXERCISES[ExerciseKey]][]).map(([key, ex]) => (
                        <button
                          key={key}
                          onClick={() => { setMotionExercise(key); setMotionAngles([]); }}
                          style={{
                            padding: '7px 10px',
                            borderRadius: 8,
                            border: `1px solid ${motionExercise === key ? 'var(--accent)' : 'var(--border)'}`,
                            background: motionExercise === key ? 'var(--accent-dim)' : 'transparent',
                            color: motionExercise === key ? 'var(--accent)' : 'var(--text-primary)',
                            fontSize: 12,
                            fontWeight: motionExercise === key ? 700 : 400,
                            cursor: 'pointer',
                            fontFamily: "'Noto Sans KR', sans-serif",
                            display: 'flex', alignItems: 'center', gap: 6,
                            transition: 'all 0.15s',
                          }}
                        >
                          <span>{ex.icon}</span>
                          <span>{ex.label}</span>
                        </button>
                      ))}
                    </div>

                    {/* 각도 분석 결과 */}
                    {motionAngles.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {motionAngles.map((a, i) => (
                          <div key={i} style={{ padding: '8px 10px', borderRadius: 8, background: STATUS_BG[a.status], border: `1px solid ${STATUS_COLOR[a.status]}30` }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                              <span style={{ fontSize: 11, fontWeight: 600 }}>{a.label}</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: STATUS_COLOR[a.status] }}>{a.angle}°</span>
                            </div>
                            <div style={{ fontSize: 10, color: STATUS_COLOR[a.status] }}>{STATUS_LABEL[a.status]}</div>
                            <p style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 2, lineHeight: 1.4 }}>{a.feedback}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* 에러 */}
                {motionError && (
                  <div style={{ marginTop: 10, padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 12, color: '#ef4444' }}>
                    ⚠️ {motionError}
                  </div>
                )}

                {/* 카메라 시작/정지 버튼 */}
                <button
                  onClick={motionActive ? stopMotion : startMotion}
                  disabled={motionLoading}
                  style={{
                    marginTop: 12,
                    width: '100%',
                    padding: '10px',
                    borderRadius: 8,
                    border: 'none',
                    background: motionActive ? 'rgba(239,68,68,0.15)' : 'var(--accent)',
                    color: motionActive ? '#ef4444' : '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: motionLoading ? 'not-allowed' : 'pointer',
                    opacity: motionLoading ? 0.6 : 1,
                    fontFamily: "'Noto Sans KR', sans-serif",
                    transition: 'all 0.15s',
                  }}
                >
                  {motionLoading ? '로딩 중...' : motionActive ? '⏹ 카메라 정지' : '▶ 카메라 시작'}
                </button>
              </div>
            )}
          </div>

          {/* ③ 시청 시간 입력 + 운동 기록 카드 */}
          <div className="card" style={{ padding: '24px 28px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📝 시청 시간 기록</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              유튜브에서 영상을 시청한 후, 시청한 위치(분:초)를 입력해 진도를 기록하세요.<br />
              전체 시청했다면 <strong>수강 완료</strong> 버튼을 눌러 주세요.
            </p>

            {/* 진도 바 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>현재 저장된 진도</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: isCompleted ? 'var(--green)' : 'var(--text-primary)' }}>
                  {formatTime(savedSec)} / {formatTime(lecture.duration)}
                  {isCompleted ? ' — 완료' : ` (${Math.round(progressRate)}%)`}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-bar-fill" style={{ width: `${progressRate}%` }} />
              </div>
            </div>

            {/* 입력 */}
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 160 }}>
                <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  시청한 시간 (분:초)
                </label>
                <input
                  className="input-field"
                  type="text"
                  placeholder={`예: 4:30 (최대 ${formatTime(lecture.duration)})`}
                  value={watchInputStr}
                  onChange={(e) => { setWatchInputStr(e.target.value); setInputError(''); setIsSaved(false); setWorkoutResult(null); }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                  style={{ width: '100%' }}
                />
                {inputError && <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{inputError}</p>}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <button
                  onClick={handleSave}
                  style={{
                    marginTop: 22, padding: '9px 18px', borderRadius: 8,
                    background: 'var(--accent)', border: 'none', color: '#fff',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    fontFamily: "'Noto Sans KR', sans-serif", transition: 'opacity 0.15s',
                  }}
                >
                  {isSaved ? '✓ 저장됨' : '저장'}
                </button>
                <button
                  onClick={handleMarkComplete}
                  style={{
                    marginTop: 22, padding: '9px 18px', borderRadius: 8,
                    background: isCompleted ? 'var(--green)' : 'var(--bg-elevated)',
                    border: `1px solid ${isCompleted ? 'var(--green)' : 'var(--border)'}`,
                    color: isCompleted ? '#fff' : 'var(--text-secondary)',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                    fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.15s',
                  }}
                >
                  {isCompleted ? '✅ 완료됨' : '수강 완료로 표시'}
                </button>
                {user && (
                  <button
                    onClick={handleSaveWorkout}
                    disabled={workoutSaving}
                    style={{
                      marginTop: 22, padding: '9px 18px', borderRadius: 8,
                      background: workoutResult ? 'rgba(34,197,94,0.15)' : 'transparent',
                      border: `1px solid ${workoutResult ? '#22c55e' : 'var(--border)'}`,
                      color: workoutResult ? '#22c55e' : 'var(--text-secondary)',
                      fontSize: 13, fontWeight: 600, cursor: workoutSaving ? 'not-allowed' : 'pointer',
                      opacity: workoutSaving ? 0.6 : 1,
                      fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.15s',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {workoutSaving ? '저장 중...'
                    : workoutResult ? `🔥 ${workoutResult.calories}kcal 저장됨`
                    : '🔥 운동 기록 저장'}
                  </button>
                )}
              </div>
            </div>

            {watchedSec > 0 && !workoutResult && (
              <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 10 }}>
                💡 "운동 기록 저장" 버튼으로 소모 칼로리를 계산하여 운동 기록에 남길 수 있습니다.
              </p>
            )}
          </div>

          {/* ④ 댓글 섹션 */}
          {user && (
            <div className="card" style={{ padding: '24px 28px' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>
                댓글
                {comments.length > 0 && (
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400, marginLeft: 6 }}>
                    ({comments.length})
                  </span>
                )}
              </h2>

              {/* 댓글 작성 */}
              <div style={{ marginBottom: 20 }}>
                <textarea
                  placeholder="강의에 대한 질문이나 의견을 남겨보세요."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)',
                    fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                    marginBottom: 10, fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleAddComment}
                    disabled={commentLoading || !commentText.trim()}
                    style={{
                      padding: '9px 20px', borderRadius: 8, background: 'var(--accent)',
                      border: 'none', color: '#fff', fontSize: 13, fontWeight: 700,
                      cursor: commentLoading || !commentText.trim() ? 'not-allowed' : 'pointer',
                      opacity: commentLoading || !commentText.trim() ? 0.5 : 1,
                      fontFamily: "'Noto Sans KR', sans-serif",
                    }}
                  >
                    {commentLoading ? '작성 중...' : '댓글 작성'}
                  </button>
                </div>
              </div>

              {/* 댓글 목록 */}
              {comments.length === 0 ? (
                <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>
                  아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {comments.map((comment) => (
                    <div key={comment.id} style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                      {/* 댓글 헤더 */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{comment.user_name}</span>
                          {comment.user_role && comment.user_role !== 'student' && (
                            <span style={{
                              fontSize: 11, fontWeight: 600,
                              color: comment.user_role === 'admin' ? 'var(--accent)' : '#60a5fa',
                              background: comment.user_role === 'admin' ? 'var(--accent-dim)' : 'rgba(96,165,250,0.15)',
                              padding: '2px 8px', borderRadius: 20,
                            }}>
                              {comment.user_role === 'admin' ? '관리자' : '강사'}
                            </span>
                          )}
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {/* 수정 버튼: 본인 댓글만 */}
                          {user.id === comment.user_id && editingCommentId !== comment.id && (
                            <button
                              onClick={() => handleStartEditComment(comment)}
                              style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                            >
                              수정
                            </button>
                          )}
                          {(user.id === comment.user_id || user.role === 'admin') && (
                            <button
                              onClick={() => handleDeleteComment(comment.id)}
                              style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}
                            >
                              삭제
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 댓글 내용 or 인라인 수정 */}
                      {editingCommentId === comment.id ? (
                        <div style={{ marginBottom: 10 }}>
                          <textarea
                            value={editCommentText}
                            onChange={(e) => setEditCommentText(e.target.value)}
                            rows={3}
                            style={{
                              width: '100%', background: 'var(--bg-elevated)', border: '1px solid var(--accent)',
                              borderRadius: 8, padding: '10px 14px', color: 'var(--text-primary)',
                              fontSize: 14, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                              marginBottom: 8, fontFamily: "'Noto Sans KR', sans-serif",
                            }}
                          />
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => { setEditingCommentId(null); setEditCommentText(''); }}
                              style={{
                                padding: '7px 14px', borderRadius: 8, background: 'transparent',
                                border: '1px solid var(--border)', color: 'var(--text-secondary)',
                                fontSize: 12, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
                              }}
                            >
                              취소
                            </button>
                            <button
                              onClick={() => handleUpdateComment(comment.id)}
                              disabled={editCommentLoading || !editCommentText.trim()}
                              style={{
                                padding: '7px 14px', borderRadius: 8, background: 'var(--accent)',
                                border: 'none', color: '#fff', fontSize: 12, fontWeight: 700,
                                cursor: editCommentLoading ? 'not-allowed' : 'pointer',
                                opacity: editCommentLoading ? 0.6 : 1,
                                fontFamily: "'Noto Sans KR', sans-serif",
                              }}
                            >
                              {editCommentLoading ? '저장 중...' : '수정 완료'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: 10 }}>
                          {comment.content}
                        </p>
                      )}

                      {/* 답글 목록 */}
                      {(comment.replies ?? []).length > 0 && (
                        <div style={{ marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {(comment.replies ?? []).map((reply) => (
                            <div key={reply.id} style={{ display: 'flex', gap: 10, paddingLeft: 16, borderLeft: '2px solid var(--accent)' }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontWeight: 700, fontSize: 13 }}>{reply.user_name}</span>
                                  <span style={{
                                    fontSize: 11, fontWeight: 600,
                                    color: reply.user_role === 'admin' ? 'var(--accent)' : '#60a5fa',
                                    background: reply.user_role === 'admin' ? 'var(--accent-dim)' : 'rgba(96,165,250,0.15)',
                                    padding: '2px 8px', borderRadius: 20,
                                  }}>
                                    {reply.user_role === 'admin' ? '관리자' : '강사'}
                                  </span>
                                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    {new Date(reply.created_at).toLocaleDateString('ko-KR')}
                                  </span>
                                </div>
                                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>{reply.content}</p>
                              </div>
                              {(user.id === reply.user_id || user.role === 'admin') && (
                                <button
                                  onClick={() => handleDeleteReply(comment.id, reply.id)}
                                  style={{ fontSize: 12, color: 'var(--text-secondary)', background: 'none', border: 'none', cursor: 'pointer', alignSelf: 'flex-start', padding: '2px 6px', flexShrink: 0 }}
                                >
                                  삭제
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* 답글 작성 (강사/관리자만) */}
                      {isInstructor && (
                        <div>
                          {replyingTo === comment.id ? (
                            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                              <textarea
                                placeholder="답글을 입력하세요..."
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                rows={2}
                                style={{
                                  flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                  borderRadius: 8, padding: '8px 12px', color: 'var(--text-primary)',
                                  fontSize: 13, resize: 'none', outline: 'none', fontFamily: "'Noto Sans KR', sans-serif",
                                }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <button
                                  onClick={() => handleAddReply(comment.id)}
                                  disabled={replyLoading || !replyText.trim()}
                                  style={{
                                    padding: '7px 14px', borderRadius: 8, background: 'var(--accent)',
                                    border: 'none', color: '#fff', fontSize: 12, fontWeight: 700,
                                    cursor: replyLoading || !replyText.trim() ? 'not-allowed' : 'pointer',
                                    opacity: replyLoading || !replyText.trim() ? 0.5 : 1,
                                    fontFamily: "'Noto Sans KR', sans-serif",
                                  }}
                                >
                                  {replyLoading ? '...' : '답글'}
                                </button>
                                <button
                                  onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                  style={{
                                    padding: '7px 14px', borderRadius: 8, background: 'transparent',
                                    border: '1px solid var(--border)', color: 'var(--text-secondary)',
                                    fontSize: 12, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
                                  }}
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => { setReplyingTo(comment.id); setReplyText(''); }}
                              style={{
                                marginTop: 4, padding: '5px 12px', borderRadius: 8,
                                background: 'transparent', border: '1px solid var(--border)',
                                color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
                                fontFamily: "'Noto Sans KR', sans-serif",
                              }}
                            >
                              답글 달기
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ⑤ 이전 / 다음 강의 */}
          <div style={{ display: 'flex', gap: 10 }}>
            {prevLecture ? (
              <Link href={`/courses/${courseId}/lectures/${prevLecture.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                <div className="card" style={{ padding: '12px 16px', cursor: 'pointer' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>← 이전 강의</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{prevLecture.title}</div>
                </div>
              </Link>
            ) : <div style={{ flex: 1 }} />}
            {nextLecture ? (
              <Link href={`/courses/${courseId}/lectures/${nextLecture.id}`} style={{ textDecoration: 'none', flex: 1 }}>
                <div className="card" style={{ padding: '12px 16px', cursor: 'pointer', textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 4 }}>다음 강의 →</div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{nextLecture.title}</div>
                </div>
              </Link>
            ) : <div style={{ flex: 1 }} />}
          </div>
        </div>

        {/* ── 오른쪽: 강의 목록 사이드바 ── */}
        <div
          className="card"
          style={{ position: 'sticky', top: 72, maxHeight: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
        >
          <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 2 }}>강의 목록</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', opacity: 0.6 }}>
              {currentIndex + 1} / {allLectures.length}강 수강 중
            </div>
            <div className="progress-bar" style={{ marginTop: 8 }}>
              <div
                className="progress-bar-fill"
                style={{
                  width: `${allLectures.length > 0
                    ? (allLectures.filter((l) => getProgress(l.id)?.completed).length / allLectures.length) * 100
                    : 0}%`,
                }}
              />
            </div>
          </div>

          <div style={{ overflowY: 'auto', flex: 1, padding: '8px 10px' }}>
            {allLectures.map((l, index) => {
              const lProgress = getProgress(l.id);
              const isActive = l.id === Number(lectureId);
              const isDone = lProgress?.completed ?? false;
              return (
                <div key={l.id} ref={isActive ? activeItemRef : null}>
                  <Link href={`/courses/${courseId}/lectures/${l.id}`} style={{ textDecoration: 'none' }}>
                    <div
                      style={{
                        padding: '9px 10px', borderRadius: 8, marginBottom: 3,
                        background: isActive ? 'var(--accent-dim)' : 'transparent',
                        border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                        display: 'flex', alignItems: 'flex-start', gap: 9,
                        cursor: 'pointer', transition: 'background 0.15s',
                      }}
                    >
                      <div
                        style={{
                          width: 22, height: 22, borderRadius: '50%',
                          background: isDone ? 'var(--green)' : isActive ? 'var(--accent)' : 'var(--bg-elevated)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 10, fontWeight: 700,
                          color: isDone || isActive ? 'white' : 'var(--text-secondary)',
                          flexShrink: 0, marginTop: 1,
                        }}
                      >
                        {isDone ? '✓' : index + 1}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 12, fontWeight: isActive ? 700 : 400,
                            color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                            lineHeight: 1.45, wordBreak: 'keep-all',
                          }}
                        >
                          {l.title}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 3 }}>
                          {formatTime(l.duration)}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              );
            })}
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
