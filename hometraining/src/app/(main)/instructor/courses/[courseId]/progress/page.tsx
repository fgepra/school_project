// src/app/(main)/instructor/courses/[courseId]/progress/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { instructorApi, courseApi } from '@/lib/api';
import { StudentProgress, Course } from '@/types';

function formatTime(sec: number): string {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

export default function StudentProgressPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [progressList, setProgressList] = useState<StudentProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      courseApi.getById(Number(courseId)),
      instructorApi.getStudentProgress(Number(courseId)),
    ])
      .then(([c, list]) => {
        setCourse(c);
        setProgressList(list);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [courseId]);

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
          href={`/instructor/courses/${courseId}/lectures`}
          style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          ← 강의 영상 목록으로
        </Link>
        <div style={{ marginTop: 16 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>수강생 진도 현황</h1>
          {course && (
            <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
              {course.title} · 총 {progressList.length}명
            </p>
          )}
        </div>
      </div>

      {progressList.length === 0 ? (
        <div
          className="card"
          style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}
        >
          아직 수강 기록이 있는 학생이 없습니다.
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr
                style={{
                  background: 'var(--bg-elevated)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {['수강생 이름', '이메일', '완료 영상 수', '총 시청 시간', '마지막 활동'].map(
                  (col) => (
                    <th
                      key={col}
                      style={{
                        padding: '14px 20px',
                        textAlign: 'left',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {col}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {progressList.map((student, idx) => (
                <tr
                  key={student.user_id}
                  style={{
                    borderBottom:
                      idx < progressList.length - 1 ? '1px solid var(--border)' : 'none',
                    transition: 'background 0.15s',
                  }}
                >
                  <td style={{ padding: '14px 20px', fontSize: 14, fontWeight: 600 }}>
                    {student.user_name}
                  </td>
                  <td
                    style={{
                      padding: '14px 20px',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {student.user_email}
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 14 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: student.completed_count > 0 ? 'var(--green)' : 'var(--text-secondary)',
                      }}
                    >
                      {student.completed_count}개
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: 14 }}>
                    {formatTime(student.total_watched_sec)}
                  </td>
                  <td
                    style={{
                      padding: '14px 20px',
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {student.last_activity
                      ? new Date(student.last_activity).toLocaleDateString('ko-KR')
                      : '없음'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
