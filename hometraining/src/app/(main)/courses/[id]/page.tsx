// src/app/(main)/courses/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { courseApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { Course, Lecture } from '@/types';

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

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { getProgress, getCompletionRate } = useProgress(user?.id ?? null);

  const [course, setCourse] = useState<Course | null>(null);
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const courseId = Number(id);
    Promise.all([courseApi.getById(courseId), courseApi.getLectures(courseId)])
      .then(([c, l]) => {
        setCourse(c);
        setLectures(l);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  if (!course) {
    return (
      <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>
        강의를 찾을 수 없습니다.
      </div>
    );
  }

  const lectureIds = lectures.map((l) => l.id);
  const completionRate = getCompletionRate(lectureIds);

  return (
    <div className="fade-in">
      {/* 뒤로가기 */}
      <Link
        href="/courses"
        style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 24 }}
      >
        ← 강의 목록
      </Link>

      {/* 강의 헤더 */}
      <div
        className="card"
        style={{ padding: 32, marginBottom: 28, display: 'grid', gridTemplateColumns: '1fr auto', gap: 24, alignItems: 'start' }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span className={`badge ${difficultyClass[course.difficulty] || 'badge-beginner'}`}>
              {difficultyLabel[course.difficulty] || course.difficulty}
            </span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              강의 {lectures.length}개
            </span>
          </div>

          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 12 }}>{course.title}</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
            {course.description}
          </p>

          {/* 진도율 */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>내 진도</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: completionRate === 100 ? 'var(--green)' : 'var(--text-primary)' }}>
                {completionRate}%
              </span>
            </div>
            <div className="progress-bar">
              <div className="progress-bar-fill" style={{ width: `${completionRate}%` }} />
            </div>
          </div>
        </div>

        {/* MET 정보 */}
        <div
          style={{
            background: 'var(--bg-elevated)',
            borderRadius: 10,
            padding: '16px 20px',
            textAlign: 'center',
            minWidth: 110,
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)' }}>
            {course.met_value}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            MET 값
          </div>
        </div>
      </div>

      {/* 강의 영상 목록 */}
      <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>강의 영상</h2>

      {lectures.length === 0 ? (
        <div
          className="card"
          style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}
        >
          아직 등록된 강의 영상이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lectures.map((lecture, index) => {
            const prog = getProgress(lecture.id);
            const isCompleted = prog?.completed ?? false;
            const watchedTime = prog?.watched_time ?? 0;
            const watchedRate = lecture.duration > 0 ? Math.min((watchedTime / lecture.duration) * 100, 100) : 0;

            return (
              <Link
                key={lecture.id}
                href={`/courses/${id}/lectures/${lecture.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card"
                  style={{
                    padding: '16px 20px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    cursor: 'pointer',
                  }}
                >
                  {/* 번호 / 완료 아이콘 */}
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      background: isCompleted ? 'var(--green)' : 'var(--bg-elevated)',
                      border: `2px solid ${isCompleted ? 'var(--green)' : 'var(--border)'}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      fontSize: 14,
                      fontWeight: 700,
                      color: isCompleted ? 'white' : 'var(--text-secondary)',
                    }}
                  >
                    {isCompleted ? '✓' : index + 1}
                  </div>

                  {/* 제목 & 진도 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>
                      {lecture.title}
                    </div>
                    {watchedTime > 0 && !isCompleted && (
                      <div className="progress-bar" style={{ width: '100%' }}>
                        <div className="progress-bar-fill" style={{ width: `${watchedRate}%` }} />
                      </div>
                    )}
                  </div>

                  {/* 시간 */}
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', flexShrink: 0 }}>
                    {formatDuration(lecture.duration)}
                  </div>

                  {/* 재생 버튼 */}
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    ▶
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
