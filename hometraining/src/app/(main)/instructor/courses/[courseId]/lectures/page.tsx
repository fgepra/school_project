// src/app/(main)/instructor/courses/[courseId]/lectures/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { courseApi, instructorApi } from '@/lib/api';
import { Course, Lecture } from '@/types';

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

const emptyForm = { title: '', video_url: '', duration: '', order_num: '' };

export default function InstructorLecturesPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // 추가 폼 상태
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [newLecture, setNewLecture] = useState(emptyForm);

  const refreshLectures = () =>
    instructorApi.getCourseLectures(Number(courseId)).then(setLectures);

  useEffect(() => {
    Promise.all([
      courseApi.getById(Number(courseId)),
      instructorApi.getCourseLectures(Number(courseId)),
    ])
      .then(([c, l]) => {
        setCourse(c);
        setLectures(l);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [courseId]);

  const handleAdd = async (e: FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await instructorApi.createLecture(Number(courseId), {
        title: newLecture.title,
        video_url: newLecture.video_url || undefined,
        duration: newLecture.duration ? Number(newLecture.duration) : undefined,
        order_num: newLecture.order_num ? Number(newLecture.order_num) : undefined,
      });
      setNewLecture(emptyForm);
      setShowForm(false);
      refreshLectures();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '추가에 실패했습니다.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!window.confirm(`"${title}" 영상을 삭제하시겠습니까?`)) return;
    setDeletingId(id);
    try {
      await instructorApi.deleteLecture(id);
      setLectures((prev) => prev.filter((l) => l.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : '삭제에 실패했습니다.');
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* 헤더 */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/instructor/courses"
          style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          ← 강의 목록으로
        </Link>
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginTop: 16,
          }}
        >
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700 }}>{course?.title}</h1>
            <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
              강의 영상 관리 · 현재 {lectures.length}개
            </p>
          </div>
          <button
            className="btn-primary"
            style={{ padding: '10px 20px' }}
            onClick={() => {
              setShowForm(!showForm);
              setFormError('');
            }}
          >
            {showForm ? '취소' : '+ 영상 추가'}
          </button>
        </div>
      </div>

      {/* 영상 추가 폼 */}
      {showForm && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>새 강의 영상 추가</h3>
          <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  영상 제목 *
                </label>
                <input
                  className="input-field"
                  type="text"
                  placeholder="예: 1강 - 워밍업 스트레칭"
                  required
                  value={newLecture.title}
                  onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })}
                />
              </div>
              <div>
                <label
                  style={{
                    fontSize: 12,
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 6,
                  }}
                >
                  순서
                </label>
                <input
                  className="input-field"
                  type="number"
                  min="0"
                  placeholder="1"
                  value={newLecture.order_num}
                  onChange={(e) => setNewLecture({ ...newLecture, order_num: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                영상 URL
              </label>
              <input
                className="input-field"
                type="url"
                placeholder="https://example.com/video.mp4"
                value={newLecture.video_url}
                onChange={(e) => setNewLecture({ ...newLecture, video_url: e.target.value })}
              />
            </div>

            <div>
              <label
                style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                재생 시간 (초)
              </label>
              <input
                className="input-field"
                type="number"
                min="0"
                placeholder="600 (10분 = 600초)"
                value={newLecture.duration}
                onChange={(e) => setNewLecture({ ...newLecture, duration: e.target.value })}
              />
            </div>

            {formError && (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--accent)',
                  background: 'var(--accent-dim)',
                  padding: '10px 14px',
                  borderRadius: 8,
                }}
              >
                {formError}
              </p>
            )}

            <button
              className="btn-primary"
              type="submit"
              disabled={formLoading}
              style={{ padding: '11px', fontSize: 14 }}
            >
              {formLoading ? '추가 중...' : '영상 추가'}
            </button>
          </form>
        </div>
      )}

      {/* 영상 목록 */}
      {lectures.length === 0 ? (
        <div
          className="card"
          style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}
        >
          <p style={{ marginBottom: 16 }}>아직 등록된 강의 영상이 없습니다.</p>
          <button
            className="btn-primary"
            style={{ padding: '10px 24px' }}
            onClick={() => setShowForm(true)}
          >
            첫 영상 추가하기
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lectures.map((lecture, index) => (
            <div
              key={lecture.id}
              className="card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                opacity: deletingId === lecture.id ? 0.5 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {/* 순서 번호 */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  flexShrink: 0,
                }}
              >
                {lecture.order_num ?? index + 1}
              </div>

              {/* 영상 정보 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                  {lecture.title}
                </div>
                <div style={{ display: 'flex', gap: 14, fontSize: 12, color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                  {lecture.duration > 0 && (
                    <span>재생 시간: {formatTime(lecture.duration)}</span>
                  )}
                  {lecture.video_url ? (
                    <span style={{ color: '#4ade80' }}>✓ 영상 등록됨</span>
                  ) : (
                    <span style={{ color: 'var(--accent)' }}>영상 없음</span>
                  )}
                </div>
              </div>

              {/* 삭제 버튼 */}
              <button
                style={{
                  padding: '7px 14px',
                  fontSize: 12,
                  borderRadius: 6,
                  border: '1px solid rgba(239,68,68,0.4)',
                  background: 'transparent',
                  color: '#ef4444',
                  cursor: deletingId === lecture.id ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
                disabled={deletingId === lecture.id}
                onClick={() => handleDelete(lecture.id, lecture.title)}
              >
                {deletingId === lecture.id ? '삭제 중...' : '삭제'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
