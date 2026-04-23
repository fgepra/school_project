// src/app/(main)/completed/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { courseApi } from '@/lib/api';
import { Course, Lecture } from '@/types';

interface CourseWithLectures extends Course {
  lectures: Lecture[];
}

export default function CompletedPage() {
  const { user } = useAuth();
  const { progressList, isLoading: progressLoading, getCompletionRate } = useProgress(
    user?.id ?? null
  );
  const [coursesWithLectures, setCoursesWithLectures] = useState<CourseWithLectures[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    courseApi
      .getAll()
      .then(async (courses) => {
        const results = await Promise.all(
          courses.map(async (course) => {
            const lectures = await courseApi.getLectures(course.id).catch(() => [] as Lecture[]);
            return { ...course, lectures };
          })
        );
        setCoursesWithLectures(results);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const completedCourses = coursesWithLectures.filter((course) => {
    if (course.lectures.length === 0) return false;
    return course.lectures.some((lec) =>
      progressList.some((p) => p.lecture_id === lec.id && p.completed)
    );
  });

  if (isLoading || progressLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* 헤더 */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>수강 완료</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
          완료한 강의 영상이 있는 과목 목록입니다.
        </p>
      </div>

      {completedCourses.length === 0 ? (
        <div
          className="card"
          style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}
        >
          아직 완료된 강의 영상이 없습니다.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 16,
          }}
        >
          {completedCourses.map((course) => {
            const lectureIds = course.lectures.map((l) => l.id);
            const completionRate = getCompletionRate(lectureIds);
            const completedCount = course.lectures.filter((lec) =>
              progressList.some((p) => p.lecture_id === lec.id && p.completed)
            ).length;

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

            return (
              <div key={course.id} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span className={`badge ${difficultyClass[course.difficulty] ?? 'badge-beginner'}`}>
                    {difficultyLabel[course.difficulty] ?? course.difficulty}
                  </span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{course.title}</h3>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 16,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {course.description}
                </p>

                <div
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    marginBottom: 8,
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>
                    완료 {completedCount} / {course.lectures.length}개
                  </span>
                  <span style={{ color: 'var(--green)', fontWeight: 600 }}>{completionRate}%</span>
                </div>

                <div className="progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${completionRate}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
