// src/app/(main)/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useProgress } from '@/hooks/useProgress';
import { courseApi, workoutApi } from '@/lib/api';
import { MOCK_COURSES } from '@/lib/mockData';
import { Course, WorkoutDayStat } from '@/types';

const THUMBNAIL_BG: Record<number, string> = {
  1: 'linear-gradient(135deg, #1a2a1a 0%, #0d1f0d 100%)',
  2: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d1f 100%)',
  3: 'linear-gradient(135deg, #2e1a1a 0%, #1f0d0d 100%)',
  4: 'linear-gradient(135deg, #1a1e2e 0%, #0d1020 100%)',
  5: 'linear-gradient(135deg, #2e2a1a 0%, #1f1a0d 100%)',
  6: 'linear-gradient(135deg, #2e1a22 0%, #1f0d14 100%)',
  7: 'linear-gradient(135deg, #1a2e2a 0%, #0d1f1c 100%)',
  8: 'linear-gradient(135deg, #2a1a2e 0%, #1c0d1f 100%)',
};

const BACKEND_URL = 'http://localhost:5000';

function getThumbnailBg(id: number) {
  return THUMBNAIL_BG[id] ?? 'var(--bg-elevated)';
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { progressList, isLoading: progressLoading } = useProgress(user?.id ?? null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [workoutStats, setWorkoutStats] = useState<WorkoutDayStat[]>([]);

  useEffect(() => {
    courseApi
      .getAll()
      .then((data) => setCourses(data.length > 0 ? data : MOCK_COURSES))
      .catch(() => setCourses(MOCK_COURSES));
    workoutApi.getStats().then(setWorkoutStats).catch(() => {});
  }, []);

  // 통계 계산
  const completedCount = progressList.filter((p) => p.completed).length;
  const totalWatchedSec = progressList.reduce((sum, p) => sum + (p.watched_time || 0), 0);
  const totalWatchedMin = Math.round(totalWatchedSec / 60);
  const totalCalories = workoutStats.reduce((sum, s) => sum + s.total_calories, 0);

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
    <div className="fade-in">
      {/* 헤더 */}
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>
          안녕하세요,{' '}
          <span style={{ color: 'var(--accent)' }}>{user?.name}</span>님 👋
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 15 }}>
          오늘도 운동을 시작해볼까요?
        </p>
      </div>

      {/* 통계 카드 4개 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 16,
          marginBottom: 40,
        }}
      >
        {[
          {
            label: '완료한 강의',
            value: progressLoading ? '-' : `${completedCount}개`,
            icon: '✅',
          },
          {
            label: '총 시청 시간',
            value: progressLoading ? '-' : `${totalWatchedMin}분`,
            icon: '⏱️',
          },
          {
            label: '수강 가능한 강의',
            value: `${courses.length}개`,
            icon: '📚',
          },
          {
            label: '총 소모 칼로리',
            value: `${totalCalories}kcal`,
            icon: '🔥',
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="card"
            style={{ padding: 24 }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>{stat.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{stat.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* 강의 목록 섹션 */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>강의 목록</h2>
          <Link
            href="/courses"
            style={{
              fontSize: 13,
              color: 'var(--accent)',
              textDecoration: 'none',
              fontWeight: 500,
            }}
          >
            전체 보기 →
          </Link>
        </div>

        {courses.length === 0 ? (
          <div
            className="card"
            style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}
          >
            등록된 강의가 없습니다.
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {courses.slice(0, 3).map((course) => {
              return (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div className="card" style={{ padding: 0, cursor: 'pointer', overflow: 'hidden' }}>
                  {/* 썸네일: 업로드 이미지 우선, 없으면 그라디언트 배경만 */}
                  <div
                    style={{
                      height: 120,
                      background: course.thumbnail ? '#111' : getThumbnailBg(course.id),
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {course.thumbnail && (
                      <img
                        src={`${BACKEND_URL}${course.thumbnail}`}
                        alt={course.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    )}
                  </div>

                  <div style={{ padding: '16px 20px 20px' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      className={`badge ${difficultyClass[course.difficulty] || 'badge-beginner'}`}
                    >
                      {difficultyLabel[course.difficulty] || course.difficulty}
                    </span>
                    {course.lecture_count !== undefined && (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        강의 {course.lecture_count}개
                      </span>
                    )}
                  </div>

                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      marginBottom: 6,
                      color: '#ffffff',
                    }}
                  >
                    {course.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.5,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {course.description}
                  </p>
                  </div>
                </div>
              </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
