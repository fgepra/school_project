// src/app/(main)/instructor/comments/page.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { instructorApi, commentApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { InstructorComment } from '@/types';

const ROLE_LABEL: Record<string, string> = {
  student: '학생',
  instructor: '강사',
  admin: '관리자',
};
const ROLE_COLOR: Record<string, string> = {
  student: 'var(--text-secondary)',
  instructor: '#60a5fa',
  admin: 'var(--accent)',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)   return '방금 전';
  if (m < 60)  return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function InstructorCommentsPage() {
  const { user } = useAuth();
  const [comments, setComments] = useState<InstructorComment[]>([]);
  const [loading, setLoading] = useState(true);

  // 강의 필터
  const [selectedCourse, setSelectedCourse] = useState<number | 'all'>('all');
  // 검색
  const [search, setSearch] = useState('');
  // 미답변 필터
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);
  // 펼쳐진 댓글
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  // 답글 작성 중인 댓글 ID
  const [replyingId, setReplyingId] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replying, setReplying] = useState(false);
  const replyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!user) return;
    instructorApi.getMyComments()
      .then(setComments)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  // ─── 강의 목록 추출 (필터용) ──────────────────────────────
  const courses = Array.from(
    new Map(comments.map(c => [c.course_id, c.course_title])).entries()
  ).map(([id, title]) => ({ id, title }));

  // ─── 필터 적용 ────────────────────────────────────────────
  const filtered = comments.filter(c => {
    if (selectedCourse !== 'all' && c.course_id !== selectedCourse) return false;
    if (search && !c.content.includes(search) && !c.user_name.includes(search)) return false;
    if (onlyUnanswered && c.replies.length > 0) return false;
    return true;
  });

  // ─── 강의별 그룹핑 ────────────────────────────────────────
  const grouped = filtered.reduce<Record<number, { courseTitle: string; lectures: Record<number, { lectureTitle: string; lectureOrder: number; comments: InstructorComment[] }> }>>((acc, c) => {
    if (!acc[c.course_id]) acc[c.course_id] = { courseTitle: c.course_title, lectures: {} };
    if (!acc[c.course_id].lectures[c.lecture_id]) {
      acc[c.course_id].lectures[c.lecture_id] = {
        lectureTitle: c.lecture_title,
        lectureOrder: c.lecture_order,
        comments: [],
      };
    }
    acc[c.course_id].lectures[c.lecture_id].comments.push(c);
    return acc;
  }, {});

  // ─── 토글 펼치기 ──────────────────────────────────────────
  const toggleExpand = (id: number) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ─── 답글 작성 ────────────────────────────────────────────
  const startReply = (commentId: number) => {
    setReplyingId(commentId);
    setReplyText('');
    setExpandedIds(prev => new Set([...prev, commentId]));
    setTimeout(() => replyRef.current?.focus(), 100);
  };

  const handleReply = async (commentId: number) => {
    if (!replyText.trim()) return;
    setReplying(true);
    try {
      const newReply = await commentApi.createReply(commentId, replyText.trim());
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, replies: [...c.replies, newReply] }
          : c
      ));
      setReplyingId(null);
      setReplyText('');
    } catch (err) {
      alert(err instanceof Error ? err.message : '답글 작성에 실패했습니다.');
    } finally {
      setReplying(false);
    }
  };

  // ─── 통계 ─────────────────────────────────────────────────
  const totalComments = comments.length;
  const unansweredCount = comments.filter(c => c.replies.length === 0).length;
  const answeredCount = totalComments - unansweredCount;

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* 헤더 */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>강의 댓글 모아보기</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
          내 강의에 달린 전체 댓글을 강의별로 확인하고 답글을 달 수 있습니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: '전체 댓글', value: totalComments, icon: '💬', color: 'var(--text-primary)' },
          { label: '미답변', value: unansweredCount, icon: '⏳', color: unansweredCount > 0 ? '#f59e0b' : 'var(--text-primary)' },
          { label: '답변 완료', value: answeredCount, icon: '✅', color: '#22c55e' },
        ].map(item => (
          <div key={item.label} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 26 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 3 }}>{item.label}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: item.color }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 필터 영역 */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* 검색 */}
        <input
          className="input-field"
          style={{ flex: 1, minWidth: 180 }}
          placeholder="댓글 내용 또는 작성자 검색..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* 강의 필터 */}
        <select
          className="input-field"
          style={{ minWidth: 180, cursor: 'pointer' }}
          value={selectedCourse}
          onChange={e => setSelectedCourse(e.target.value === 'all' ? 'all' : Number(e.target.value))}
        >
          <option value="all">전체 강의</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>

        {/* 미답변 필터 */}
        <button
          onClick={() => setOnlyUnanswered(v => !v)}
          style={{
            padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: `1px solid ${onlyUnanswered ? '#f59e0b' : 'var(--border)'}`,
            background: onlyUnanswered ? 'rgba(245,158,11,0.12)' : 'transparent',
            color: onlyUnanswered ? '#f59e0b' : 'var(--text-secondary)',
            cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
            transition: 'all 0.15s',
          }}
        >
          ⏳ 미답변만 보기
        </button>
      </div>

      {/* 댓글 없음 */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>💬</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
            {comments.length === 0 ? '아직 달린 댓글이 없습니다.' : '조건에 맞는 댓글이 없습니다.'}
          </p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            {comments.length === 0 ? '수강생이 댓글을 달면 여기서 모아볼 수 있습니다.' : '다른 필터를 선택해 보세요.'}
          </p>
        </div>
      ) : (
        /* 강의별 그룹 */
        Object.entries(grouped).map(([courseIdStr, courseGroup]) => {
          const courseId = Number(courseIdStr);
          return (
            <div key={courseId} style={{ marginBottom: 28 }}>
              {/* 강의 헤더 */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <h2 style={{ fontSize: 17, fontWeight: 700 }}>📚 {courseGroup.courseTitle}</h2>
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 9px', borderRadius: 20,
                    background: 'var(--bg-elevated)', color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}>
                    {Object.values(courseGroup.lectures).reduce((s, l) => s + l.comments.length, 0)}개 댓글
                  </span>
                </div>
                <Link
                  href={`/instructor/courses/${courseId}/lectures`}
                  style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}
                >
                  강의 관리 →
                </Link>
              </div>

              {/* 강의 영상별 그룹 */}
              {Object.entries(courseGroup.lectures)
                .sort(([, a], [, b]) => a.lectureOrder - b.lectureOrder)
                .map(([lectureIdStr, lectureGroup]) => (
                  <div key={lectureIdStr} style={{ marginBottom: 12, marginLeft: 8 }}>
                    {/* 강의 영상 소제목 */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px', marginBottom: 8,
                      borderLeft: '3px solid var(--accent)',
                      background: 'var(--bg-elevated)', borderRadius: '0 8px 8px 0',
                    }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>
                        {lectureGroup.lectureOrder}강
                      </span>
                      <span style={{ fontSize: 13, fontWeight: 700 }}>{lectureGroup.lectureTitle}</span>
                      <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                        댓글 {lectureGroup.comments.length}개
                      </span>
                      <Link
                        href={`/courses/${courseId}/lectures/${lectureIdStr}`}
                        style={{ fontSize: 11, color: 'var(--accent)', textDecoration: 'none', marginLeft: 6 }}
                        target="_blank"
                      >
                        영상 보기 ↗
                      </Link>
                    </div>

                    {/* 댓글 목록 */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 8 }}>
                      {lectureGroup.comments.map(comment => {
                        const isExpanded = expandedIds.has(comment.id);
                        const hasReplies = comment.replies.length > 0;
                        const isReplying = replyingId === comment.id;

                        return (
                          <div key={comment.id} className="card" style={{ padding: '16px 18px' }}>
                            {/* 댓글 본문 */}
                            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                              {/* 아바타 */}
                              <div style={{
                                width: 36, height: 36, borderRadius: '50%',
                                background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 14, fontWeight: 700, flexShrink: 0,
                                color: ROLE_COLOR[comment.user_role] ?? 'var(--text-secondary)',
                              }}>
                                {comment.user_name.charAt(0)}
                              </div>

                              <div style={{ flex: 1, minWidth: 0 }}>
                                {/* 작성자 + 시각 */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                                  <span style={{ fontSize: 13, fontWeight: 700 }}>{comment.user_name}</span>
                                  <span style={{
                                    fontSize: 10, fontWeight: 600, padding: '1px 7px', borderRadius: 10,
                                    color: ROLE_COLOR[comment.user_role] ?? 'var(--text-secondary)',
                                    background: 'var(--bg-elevated)', border: `1px solid ${ROLE_COLOR[comment.user_role] ?? 'var(--border)'}40`,
                                  }}>
                                    {ROLE_LABEL[comment.user_role] ?? comment.user_role}
                                  </span>
                                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                                    {timeAgo(comment.created_at)}
                                  </span>
                                </div>

                                {/* 댓글 내용 */}
                                <p style={{ fontSize: 14, lineHeight: 1.65, color: 'var(--text-primary)', margin: 0 }}>
                                  {comment.content}
                                </p>

                                {/* 하단 액션 */}
                                <div style={{ display: 'flex', gap: 12, marginTop: 10, alignItems: 'center' }}>
                                  {/* 답글 수 / 토글 */}
                                  {hasReplies && (
                                    <button
                                      onClick={() => toggleExpand(comment.id)}
                                      style={{
                                        fontSize: 12, color: '#60a5fa', background: 'none',
                                        border: 'none', cursor: 'pointer', padding: 0, fontFamily: "'Noto Sans KR', sans-serif",
                                      }}
                                    >
                                      {isExpanded ? '▲ 답글 숨기기' : `▼ 답글 ${comment.replies.length}개 보기`}
                                    </button>
                                  )}

                                  {/* 미답변 뱃지 */}
                                  {!hasReplies && (
                                    <span style={{
                                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                                      color: '#f59e0b', background: 'rgba(245,158,11,0.12)',
                                      border: '1px solid rgba(245,158,11,0.3)',
                                    }}>
                                      미답변
                                    </span>
                                  )}
                                  {hasReplies && (
                                    <span style={{
                                      fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 10,
                                      color: '#22c55e', background: 'rgba(34,197,94,0.1)',
                                    }}>
                                      ✓ 답변 완료
                                    </span>
                                  )}

                                  {/* 답글 달기 버튼 */}
                                  <button
                                    onClick={() => isReplying ? setReplyingId(null) : startReply(comment.id)}
                                    style={{
                                      marginLeft: 'auto', fontSize: 12, fontWeight: 600,
                                      padding: '5px 12px', borderRadius: 6, cursor: 'pointer',
                                      border: `1px solid ${isReplying ? 'var(--border)' : 'var(--accent)'}`,
                                      background: isReplying ? 'var(--bg-elevated)' : 'var(--accent)',
                                      color: isReplying ? 'var(--text-secondary)' : '#fff',
                                      fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.15s',
                                    }}
                                  >
                                    {isReplying ? '취소' : '↩ 답글 달기'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* 답글 목록 */}
                            {isExpanded && hasReplies && (
                              <div style={{
                                marginTop: 14, paddingTop: 14,
                                borderTop: '1px solid var(--border)',
                                paddingLeft: 20,
                                display: 'flex', flexDirection: 'column', gap: 10,
                              }}>
                                {comment.replies.map(reply => (
                                  <div key={reply.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                    <div style={{
                                      width: 28, height: 28, borderRadius: '50%',
                                      background: 'var(--bg-elevated)', border: `1px solid ${ROLE_COLOR[reply.user_role] ?? 'var(--border)'}40`,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                      fontSize: 11, fontWeight: 700, flexShrink: 0,
                                      color: ROLE_COLOR[reply.user_role] ?? 'var(--text-secondary)',
                                    }}>
                                      {reply.user_name.charAt(0)}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                                        <span style={{ fontSize: 12, fontWeight: 700 }}>{reply.user_name}</span>
                                        <span style={{
                                          fontSize: 9, fontWeight: 600, padding: '1px 6px', borderRadius: 8,
                                          color: ROLE_COLOR[reply.user_role] ?? 'var(--text-secondary)',
                                          background: 'var(--bg-elevated)',
                                        }}>
                                          {ROLE_LABEL[reply.user_role] ?? reply.user_role}
                                        </span>
                                        <span style={{ fontSize: 10, color: 'var(--text-secondary)', marginLeft: 'auto' }}>
                                          {timeAgo(reply.created_at)}
                                        </span>
                                      </div>
                                      <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)', margin: 0 }}>
                                        {reply.content}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 답글 입력창 */}
                            {isReplying && (
                              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)', paddingLeft: 20 }}>
                                <textarea
                                  ref={replyRef}
                                  className="input-field"
                                  rows={3}
                                  placeholder="답글을 입력하세요..."
                                  value={replyText}
                                  onChange={e => setReplyText(e.target.value)}
                                  style={{ width: '100%', resize: 'vertical', fontSize: 13, padding: '10px 12px' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                                  <button
                                    className="btn-ghost"
                                    style={{ padding: '7px 16px', fontSize: 13 }}
                                    onClick={() => setReplyingId(null)}
                                  >
                                    취소
                                  </button>
                                  <button
                                    className="btn-primary"
                                    style={{ padding: '7px 16px', fontSize: 13 }}
                                    disabled={replying || !replyText.trim()}
                                    onClick={() => handleReply(comment.id)}
                                  >
                                    {replying ? '등록 중...' : '답글 등록'}
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          );
        })
      )}
    </div>
  );
}
