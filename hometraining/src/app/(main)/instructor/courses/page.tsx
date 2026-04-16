// src/app/(main)/instructor/courses/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { instructorApi } from '@/lib/api';
import { Course } from '@/types';

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};

const DIFFICULTY_CLASS: Record<string, string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
};

export default function InstructorCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchCourses = () => {
    instructorApi.getMyCourses()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleDelete = async (courseId: number, title: string) => {
    if (!window.confirm(`"${title}" 강의를 삭제하시겠습니까?\n강의 영상 및 진도 데이터도 모두 삭제됩니다.`)) return;

    setDeletingId(courseId);
    try {
      await instructorApi.deleteCourse(courseId);
      setCourses(prev => prev.filter(c => c.id !== courseId));
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 32,
        }}
      >
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>강의 관리</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
            강의를 생성하고 관리하세요.
          </p>
        </div>
        <Link href="/instructor/courses/new">
          <button className="btn-primary" style={{ padding: '10px 20px' }}>
            + 새 강의 만들기
          </button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p style={{ fontSize: 16, marginBottom: 20 }}>아직 등록한 강의가 없습니다.</p>
          <Link href="/instructor/courses/new">
            <button className="btn-primary" style={{ padding: '12px 28px' }}>첫 강의 만들기</button>
          </Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {courses.map((course) => (
            <div
              key={course.id}
              className="card"
              style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                opacity: deletingId === course.id ? 0.5 : 1,
              }}
            >
              {/* 강의 정보 */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span className={`badge ${DIFFICULTY_CLASS[course.difficulty] || 'badge-beginner'}`}>
                    {DIFFICULTY_LABEL[course.difficulty] || course.difficulty}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    영상 {course.lecture_count ?? 0}개
                  </span>
                  {course.instructor_name && (
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      · {course.instructor_name}
                    </span>
                  )}
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{course.title}</h3>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {course.description}
                </p>
              </div>

              {/* 액션 버튼 */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Link href={`/instructor/courses/${course.id}/lectures`}>
                  <button
                    className="btn-ghost"
                    style={{ padding: '8px 14px', fontSize: 13 }}
                    disabled={deletingId === course.id}
                  >
                    영상 관리
                  </button>
                </Link>
                <Link href={`/instructor/courses/${course.id}/edit`}>
                  <button
                    className="btn-ghost"
                    style={{ padding: '8px 14px', fontSize: 13 }}
                    disabled={deletingId === course.id}
                  >
                    수정
                  </button>
                </Link>
                <button
                  style={{
                    padding: '8px 14px',
                    fontSize: 13,
                    borderRadius: 6,
                    border: '1px solid rgba(239,68,68,0.4)',
                    background: 'transparent',
                    color: '#ef4444',
                    cursor: 'pointer',
                  }}
                  disabled={deletingId === course.id}
                  onClick={() => handleDelete(course.id, course.title)}
                >
                  {deletingId === course.id ? '삭제 중...' : '삭제'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
