// src/app/(main)/courses/[id]/lectures/[lectureId]/page.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { courseApi, lectureApi, commentApi } from '@/lib/api';
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

// ─── 메인 컴포넌트 ───────────────────────────────────────────
export default function LectureWatchPage() {
  const { id: courseId, lectureId } = useParams<{ id: string; lectureId: string }>();
  const { user, isInstructor } = useAuth();
  const { getProgress, saveProgress } = useProgress(user?.id ?? null);

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 시청 시간 수동 입력 상태
  const [watchInputStr, setWatchInputStr] = useState('');  // "MM:SS" 형식
  const [inputError, setInputError] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  // 댓글 상태
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

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

  // 댓글 불러오기
  useEffect(() => {
    if (!user) return;
    commentApi.getByLecture(Number(lectureId))
      .then(setComments)
      .catch(console.error);
  }, [lectureId, user]);

  // 강의 변경 시 입력 초기화 + 저장된 진도 불러오기
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
  }, [lecture?.id]);

  // ─── 진도 저장 핸들러 ────────────────────────────────────────
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
      setInputError('저장에 실패했습니다. 다시 시도해 주세요.');
    }
  }, [lecture, watchInputStr, saveProgress]);

  // ─── 완료 처리 ───────────────────────────────────────────────
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

  const handleAddReply = async (commentId: number) => {
    if (!replyText.trim() || replyLoading) return;
    setReplyLoading(true);
    try {
      const newReply = await commentApi.createReply(commentId, replyText.trim());
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, replies: [...(c.replies ?? []), newReply] }
            : c
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

  // ─── 이전 / 다음 강의 ──────────────────────────────────────
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
  const progressRate = lecture.duration > 0
    ? Math.min((savedSec / lecture.duration) * 100, 100)
    : 0;
  const isCompleted = progress?.completed ?? false;

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

          {/* ② 유튜브 이동 카드 */}
          <div
            className="card"
            style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, textAlign: 'center' }}
          >
            <span style={{ fontSize: 52 }}>▶️</span>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>유튜브에서 강의 영상 시청하기</p>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                아래 버튼을 눌러 유튜브에서 영상을 시청한 후,<br />
                시청한 시간을 아래 입력칸에 기록하고 저장하세요.
              </p>
            </div>

            {lecture.video_url ? (
              <a
                href={lecture.video_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 28px',
                  borderRadius: 10,
                  background: '#FF0000',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  textDecoration: 'none',
                  transition: 'opacity 0.15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.85')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
                  <path d="M21.543 2.5A2.75 2.75 0 0019.6.55C17.9 0 11 0 11 0S4.1 0 2.4.55A2.75 2.75 0 00.457 2.5 29 29 0 000 8a29 29 0 00.457 5.5A2.75 2.75 0 002.4 15.45C4.1 16 11 16 11 16s6.9 0 8.6-.55a2.75 2.75 0 001.943-1.95A29 29 0 0022 8a29 29 0 00-.457-5.5z" fill="#fff"/>
                  <path d="M8.8 11.4V4.6L14.6 8l-5.8 3.4z" fill="#FF0000"/>
                </svg>
                유튜브에서 영상 보기
              </a>
            ) : (
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '10px 20px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)' }}>
                🎬 아직 영상 URL이 등록되지 않은 강의입니다
              </div>
            )}
          </div>

          {/* ③ 시청 시간 입력 카드 */}
          <div className="card" style={{ padding: '24px 28px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>📝 시청 시간 기록</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
              유튜브에서 영상을 시청한 후, 시청한 위치(분:초)를 입력해 진도를 기록하세요.<br />
              전체 시청했다면 <strong>수강 완료</strong> 버튼을 눌러 주세요.
            </p>

            {/* 저장된 진도 바 */}
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

            {/* 입력 영역 */}
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
                  onChange={(e) => {
                    setWatchInputStr(e.target.value);
                    setInputError('');
                    setIsSaved(false);
                  }}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
                  style={{ width: '100%' }}
                />
                {inputError && (
                  <p style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>{inputError}</p>
                )}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', paddingBottom: 0, flexWrap: 'wrap' }}>
                <button
                  onClick={handleSave}
                  style={{
                    marginTop: 22,
                    padding: '9px 20px',
                    borderRadius: 8,
                    background: 'var(--accent)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: "'Noto Sans KR', sans-serif",
                    transition: 'opacity 0.15s',
                  }}
                >
                  {isSaved ? '✓ 저장됨' : '저장'}
                </button>
                <button
                  onClick={handleMarkComplete}
                  style={{
                    marginTop: 22,
                    padding: '9px 20px',
                    borderRadius: 8,
                    background: isCompleted ? 'var(--green)' : 'var(--bg-elevated)',
                    border: `1px solid ${isCompleted ? 'var(--green)' : 'var(--border)'}`,
                    color: isCompleted ? '#fff' : 'var(--text-secondary)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: "'Noto Sans KR', sans-serif",
                    transition: 'all 0.15s',
                  }}
                >
                  {isCompleted ? '✅ 완료됨' : '수강 완료로 표시'}
                </button>
              </div>
            </div>
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
                    width: '100%',
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: 8,
                    padding: '10px 14px',
                    color: 'var(--text-primary)',
                    fontSize: 14,
                    resize: 'vertical',
                    outline: 'none',
                    boxSizing: 'border-box',
                    marginBottom: 10,
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    onClick={handleAddComment}
                    disabled={commentLoading || !commentText.trim()}
                    style={{
                      padding: '9px 20px',
                      borderRadius: 8,
                      background: 'var(--accent)',
                      border: 'none',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 700,
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
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: comment.user_role === 'admin' ? 'var(--accent)' : '#60a5fa',
                                background: comment.user_role === 'admin' ? 'var(--accent-dim)' : 'rgba(96,165,250,0.15)',
                                padding: '2px 8px',
                                borderRadius: 20,
                              }}
                            >
                              {comment.user_role === 'admin' ? '관리자' : '강사'}
                            </span>
                          )}
                          <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                            {new Date(comment.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                        {(user.id === comment.user_id || user.role === 'admin') && (
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            style={{
                              fontSize: 12,
                              color: 'var(--text-secondary)',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '2px 6px',
                            }}
                          >
                            삭제
                          </button>
                        )}
                      </div>

                      {/* 댓글 내용 */}
                      <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: 10 }}>
                        {comment.content}
                      </p>

                      {/* 답글 목록 */}
                      {(comment.replies ?? []).length > 0 && (
                        <div
                          style={{
                            marginBottom: 10,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 10,
                          }}
                        >
                          {(comment.replies ?? []).map((reply) => (
                            <div
                              key={reply.id}
                              style={{
                                display: 'flex',
                                gap: 10,
                                paddingLeft: 16,
                                borderLeft: '2px solid var(--accent)',
                              }}
                            >
                              <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                  <span style={{ fontWeight: 700, fontSize: 13 }}>{reply.user_name}</span>
                                  <span
                                    style={{
                                      fontSize: 11,
                                      fontWeight: 600,
                                      color: reply.user_role === 'admin' ? 'var(--accent)' : '#60a5fa',
                                      background: reply.user_role === 'admin' ? 'var(--accent-dim)' : 'rgba(96,165,250,0.15)',
                                      padding: '2px 8px',
                                      borderRadius: 20,
                                    }}
                                  >
                                    {reply.user_role === 'admin' ? '관리자' : '강사'}
                                  </span>
                                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                                    {new Date(reply.created_at).toLocaleDateString('ko-KR')}
                                  </span>
                                </div>
                                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>
                                  {reply.content}
                                </p>
                              </div>
                              {(user.id === reply.user_id || user.role === 'admin') && (
                                <button
                                  onClick={() => handleDeleteReply(comment.id, reply.id)}
                                  style={{
                                    fontSize: 12,
                                    color: 'var(--text-secondary)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    alignSelf: 'flex-start',
                                    padding: '2px 6px',
                                    flexShrink: 0,
                                  }}
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
                                  flex: 1,
                                  background: 'var(--bg-elevated)',
                                  border: '1px solid var(--border)',
                                  borderRadius: 8,
                                  padding: '8px 12px',
                                  color: 'var(--text-primary)',
                                  fontSize: 13,
                                  resize: 'none',
                                  outline: 'none',
                                  fontFamily: "'Noto Sans KR', sans-serif",
                                }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <button
                                  onClick={() => handleAddReply(comment.id)}
                                  disabled={replyLoading || !replyText.trim()}
                                  style={{
                                    padding: '7px 14px',
                                    borderRadius: 8,
                                    background: 'var(--accent)',
                                    border: 'none',
                                    color: '#fff',
                                    fontSize: 12,
                                    fontWeight: 700,
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
                                    padding: '7px 14px',
                                    borderRadius: 8,
                                    background: 'transparent',
                                    border: '1px solid var(--border)',
                                    color: 'var(--text-secondary)',
                                    fontSize: 12,
                                    cursor: 'pointer',
                                    fontFamily: "'Noto Sans KR', sans-serif",
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
                                marginTop: 4,
                                padding: '5px 12px',
                                borderRadius: 8,
                                background: 'transparent',
                                border: '1px solid var(--border)',
                                color: 'var(--text-secondary)',
                                fontSize: 12,
                                cursor: 'pointer',
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

          {/* ⑤ 이전 / 다음 강의 카드 */}
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
    </div>
  );
}
