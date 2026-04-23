// src/app/(main)/admin/courses/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { instructorApi } from '@/lib/api';
import { Course } from '@/types';

const BACKEND_URL = 'http://localhost:5000';

const DIFFICULTIES = [
  { value: '', label: '전체' },
  { value: 'beginner', label: '초급' },
  { value: 'intermediate', label: '중급' },
  { value: 'advanced', label: '고급' },
];

const difficultyLabel: Record<string, string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};

const difficultyClass: Record<string, string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
};

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');

  useEffect(() => {
    instructorApi
      .getMyCourses()
      .then(setCourses)
      .catch(() => setError('강의 목록을 불러오는데 실패했습니다.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleDelete = async (courseId: number, title: string) => {
    if (!window.confirm(`"${title}" 강의를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      await instructorApi.deleteCourse(courseId);
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
    } catch {
      alert('강의 삭제에 실패했습니다.');
    }
  };

  const filtered = courses.filter((c) => filter === '' || c.difficulty === filter);

  return (
    <div className="fade-in">
      {/* 헤더 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32,
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <Link
            href="/admin"
            style={{
              fontSize: 13,
              color: 'var(--text-secondary)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            ← 관리 대시보드
          </Link>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>강의 관리</h1>
        </div>
        <Link href="/instructor/courses/new" style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            + 강의 추가
          </button>
        </Link>
      </div>

      {error && (
        <div className="card" style={{ padding: 20, color: 'var(--accent)', marginBottom: 20 }}>
          {error}
        </div>
      )}

      {/* 필터 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {DIFFICULTIES.map((d) => (
          <button
            key={d.value}
            onClick={() => setFilter(d.value)}
            style={{
              padding: '7px 16px',
              borderRadius: 8,
              border: '1px solid',
              borderColor: filter === d.value ? 'var(--accent)' : 'var(--border)',
              background: filter === d.value ? 'var(--accent-dim)' : 'transparent',
              color: filter === d.value ? 'var(--accent)' : 'var(--text-secondary)',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: "'Noto Sans KR', sans-serif",
              transition: 'all 0.15s',
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* 강의 목록 */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
          강의가 없습니다.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {filtered.map((course, idx) => (
            <div
              key={course.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '14px 20px',
                borderBottom: idx < filtered.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              {/* 썸네일 */}
              <div
                style={{
                  width: 48,
                  height: 36,
                  borderRadius: 6,
                  overflow: 'hidden',
                  flexShrink: 0,
                  background: 'var(--bg-elevated)',
                }}
              >
                {course.thumbnail ? (
                  <img
                    src={`${BACKEND_URL}${course.thumbnail}`}
                    alt={course.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      background: 'linear-gradient(135deg, var(--bg-elevated), var(--border))',
                    }}
                  />
                )}
              </div>

              {/* 제목 + 난이도 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {course.title}
                </div>
                <span className={`badge ${difficultyClass[course.difficulty] || 'badge-beginner'}`} style={{ marginTop: 4, display: 'inline-block' }}>
                  {difficultyLabel[course.difficulty] || course.difficulty}
                </span>
              </div>

              {/* 강사명 */}
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  minWidth: 80,
                  textAlign: 'center',
                }}
              >
                {course.instructor_name ?? '-'}
              </div>

              {/* 영상 수 */}
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  minWidth: 60,
                  textAlign: 'center',
                }}
              >
                {course.lecture_count !== undefined ? `${course.lecture_count}개` : '-'}
              </div>

              {/* MET */}
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  minWidth: 60,
                  textAlign: 'center',
                }}
              >
                MET {course.met_value}
              </div>

              {/* 수정 버튼 */}
              <Link href={`/instructor/courses/${course.id}/edit`} style={{ textDecoration: 'none' }}>
                <button
                  className="btn-ghost"
                  style={{ fontSize: 12, padding: '6px 12px' }}
                >
                  수정
                </button>
              </Link>

              {/* 삭제 버튼 */}
              <button
                onClick={() => handleDelete(course.id, course.title)}
                style={{
                  fontSize: 12,
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid rgba(239,68,68,0.4)',
                  background: 'transparent',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontFamily: "'Noto Sans KR', sans-serif",
                  transition: 'all 0.15s',
                }}
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
