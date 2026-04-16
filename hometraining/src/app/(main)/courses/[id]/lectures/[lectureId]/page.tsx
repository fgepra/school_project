// src/app/(main)/courses/[id]/lectures/[lectureId]/page.tsx
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { courseApi, lectureApi, commentApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { Lecture, Comment } from '@/types';

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function LectureWatchPage() {
  const { id: courseId, lectureId } = useParams<{ id: string; lectureId: string }>();
  const { user, isInstructor } = useAuth();
  const { getProgress, saveProgress } = useProgress(user?.id ?? null);

  const [lecture, setLecture] = useState<Lecture | null>(null);
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 댓글 상태
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);

  // 비디오 상태
  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // 진도 자동저장 타이머
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const lid = Number(lectureId);
    const cid = Number(courseId);

    Promise.all([lectureApi.getById(lid), courseApi.getLectures(cid)])
      .then(([l, all]) => {
        setLecture(l);
        setAllLectures(all);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [lectureId, courseId]);

  // 댓글 불러오기
  useEffect(() => {
    if (!user) return;
    commentApi.getByLecture(Number(lectureId))
      .then(setComments)
      .catch(console.error);
  }, [lectureId, user]);

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

  // 이미 저장된 진도로 비디오 시작 위치 복원
  useEffect(() => {
    if (!lecture || !videoRef.current) return;
    const prog = getProgress(lecture.id);
    if (prog && prog.watched_time > 0 && !prog.completed) {
      videoRef.current.currentTime = prog.watched_time;
    }
  }, [lecture, getProgress]);

  // 진도 저장 (디바운스 10초)
  const scheduleSave = useCallback(
    (watchedTime: number, completed: boolean) => {
      if (!lecture) return;
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          await saveProgress(lecture.id, Math.floor(watchedTime), completed);
          setIsSaved(true);
          setTimeout(() => setIsSaved(false), 2000);
        } catch (e) {
          console.error('진도 저장 실패', e);
        }
      }, 5000); // 5초 디바운스
    },
    [lecture, saveProgress]
  );

  // 비디오 이벤트 핸들러
  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const t = videoRef.current.currentTime;
    const d = videoRef.current.duration || 0;
    setCurrentTime(t);
    const completed = d > 0 && t / d >= 0.9; // 90% 이상 시청 시 완료
    scheduleSave(t, completed);
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
  };

  const handlePlay = () => setIsPlaying(true);
  const handlePause = () => setIsPlaying(false);

  const handleEnded = async () => {
    if (!lecture) return;
    setIsPlaying(false);
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    await saveProgress(lecture.id, lecture.duration, true);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // 시크바 클릭
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    videoRef.current.currentTime = ratio * duration;
  };

  // 재생/정지 토글
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
  };

  // 이전/다음 강의
  const currentIndex = allLectures.findIndex((l) => l.id === Number(lectureId));
  const prevLecture = currentIndex > 0 ? allLectures[currentIndex - 1] : null;
  const nextLecture = currentIndex < allLectures.length - 1 ? allLectures[currentIndex + 1] : null;

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
  const progressRate = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fade-in">
      {/* 뒤로가기 */}
      <Link
        href={`/courses/${courseId}`}
        style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          marginBottom: 20,
        }}
      >
        ← 강의 목록으로
      </Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>
        {/* 비디오 영역 */}
        <div>
          {/* 비디오 플레이어 */}
          <div
            style={{
              background: '#000',
              borderRadius: 12,
              overflow: 'hidden',
              aspectRatio: '16/9',
              position: 'relative',
            }}
          >
            {lecture.video_url ? (
              <video
                ref={videoRef}
                src={lecture.video_url}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={handlePlay}
                onPause={handlePause}
                onEnded={handleEnded}
              />
            ) : (
              /* video_url이 없을 때 플레이스홀더 */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 12,
                  color: 'var(--text-secondary)',
                }}
              >
                <span style={{ fontSize: 48 }}>🎬</span>
                <span style={{ fontSize: 14 }}>영상 URL이 등록되지 않았습니다</span>
              </div>
            )}
          </div>

          {/* 커스텀 컨트롤 바 */}
          <div
            className="card"
            style={{ padding: '14px 20px', marginTop: 10 }}
          >
            {/* 시크바 */}
            <div
              className="progress-bar"
              style={{ height: 6, cursor: 'pointer', marginBottom: 12 }}
              onClick={handleSeek}
            >
              <div
                className="progress-bar-fill"
                style={{ width: `${progressRate}%`, height: '100%' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {/* 재생/정지 버튼 */}
                <button
                  onClick={togglePlay}
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: 'var(--accent)',
                    border: 'none',
                    color: 'white',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isPlaying ? '⏸' : '▶'}
                </button>

                {/* 시간 표시 */}
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>

              {/* 저장 상태 */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isSaved && (
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--green)',
                      background: 'rgba(34,197,94,0.12)',
                      padding: '3px 10px',
                      borderRadius: 20,
                    }}
                  >
                    ✓ 진도 저장됨
                  </span>
                )}
                {progress?.completed && (
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--green)',
                      background: 'rgba(34,197,94,0.12)',
                      padding: '3px 10px',
                      borderRadius: 20,
                    }}
                  >
                    ✅ 완료
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* 강의 정보 */}
          <div style={{ marginTop: 16 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              {lecture.title}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              총 재생 시간: {formatTime(lecture.duration)}
            </p>
          </div>

          {/* 이전/다음 강의 */}
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
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

        {/* 댓글 섹션 */}
        {user && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>
              댓글 {comments.length > 0 && (
                <span style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 400 }}>
                  ({comments.length})
                </span>
              )}
            </h2>

            {/* 댓글 작성 */}
            <div className="card" style={{ padding: 20, marginBottom: 16 }}>
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
                  marginBottom: 12,
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  className="btn-primary"
                  onClick={handleAddComment}
                  disabled={commentLoading || !commentText.trim()}
                  style={{ padding: '9px 20px', fontSize: 14 }}
                >
                  {commentLoading ? '작성 중...' : '댓글 작성'}
                </button>
              </div>
            </div>

            {/* 댓글 목록 */}
            {comments.length === 0 ? (
              <div
                className="card"
                style={{ padding: 32, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}
              >
                아직 댓글이 없습니다. 첫 번째 댓글을 남겨보세요!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {comments.map((comment) => (
                  <div key={comment.id} className="card" style={{ padding: 20 }}>
                    {/* 댓글 헤더 */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
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
                    <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--text-primary)', marginBottom: 12 }}>
                      {comment.content}
                    </p>

                    {/* 답글 목록 */}
                    {(comment.replies ?? []).length > 0 && (
                      <div
                        style={{
                          marginTop: 12,
                          paddingTop: 12,
                          borderTop: '1px solid var(--border)',
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
                              paddingLeft: 12,
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
                      <div style={{ marginTop: 12 }}>
                        {replyingTo === comment.id ? (
                          <div style={{ display: 'flex', gap: 8 }}>
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
                              }}
                            />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              <button
                                className="btn-primary"
                                onClick={() => handleAddReply(comment.id)}
                                disabled={replyLoading || !replyText.trim()}
                                style={{ padding: '7px 14px', fontSize: 12 }}
                              >
                                {replyLoading ? '...' : '답글'}
                              </button>
                              <button
                                className="btn-ghost"
                                onClick={() => { setReplyingTo(null); setReplyText(''); }}
                                style={{ padding: '7px 14px', fontSize: 12 }}
                              >
                                취소
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="btn-ghost"
                            onClick={() => { setReplyingTo(comment.id); setReplyText(''); }}
                            style={{ padding: '6px 12px', fontSize: 12 }}
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

        {/* 사이드바 - 강의 목록 */}
        <div>
          <div
            className="card"
            style={{ padding: 16, position: 'sticky', top: 80 }}
          >
            <h3 style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, color: 'var(--text-secondary)' }}>
              강의 목록 ({allLectures.length}개)
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {allLectures.map((l, index) => {
                const lProgress = getProgress(l.id);
                const isActive = l.id === Number(lectureId);
                const isDone = lProgress?.completed ?? false;

                return (
                  <Link
                    key={l.id}
                    href={`/courses/${courseId}/lectures/${l.id}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      style={{
                        padding: '10px 12px',
                        borderRadius: 8,
                        background: isActive ? 'var(--accent-dim)' : 'transparent',
                        border: `1px solid ${isActive ? 'var(--accent)' : 'transparent'}`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                      }}
                    >
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          background: isDone ? 'var(--green)' : isActive ? 'var(--accent)' : 'var(--bg-elevated)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          fontWeight: 700,
                          color: isDone || isActive ? 'white' : 'var(--text-secondary)',
                          flexShrink: 0,
                        }}
                      >
                        {isDone ? '✓' : index + 1}
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: isActive ? 700 : 400,
                          color: isActive ? 'var(--accent)' : 'var(--text-primary)',
                          lineHeight: 1.4,
                        }}
                      >
                        {l.title}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
