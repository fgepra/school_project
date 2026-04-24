// src/app/(main)/instructor/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { instructorApi } from '@/lib/api';
import { Course } from '@/types';
import { useAuth } from '@/hooks/useAuth';

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

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    instructorApi.getMyCourses()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>
          안녕하세요, <span style={{ color: 'var(--accent)' }}>{user?.name}</span> 강사님
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 15 }}>
          담당 강의를 관리하세요.
        </p>
      </div>

      {/* 통계 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 40,
        }}
      >
        {[
          { label: '담당 강의', value: `${courses.length}개`, icon: '📚' },
          {
            label: '전체 강의 영상',
            value: `${courses.reduce((sum, c) => sum + (c.lecture_count || 0), 0)}개`,
            icon: '🎬',
          },
          {
            label: '난이도 구성',
            value: `초급 ${courses.filter(c => c.difficulty === 'beginner').length} / 중급 ${courses.filter(c => c.difficulty === 'intermediate').length} / 고급 ${courses.filter(c => c.difficulty === 'advanced').length}`,
            icon: '📊',
          },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{stat.icon}</div>
            <div style={{ fontSize: stat.label === '난이도 구성' ? 14 : 26, fontWeight: 700 }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* 최근 강의 목록 */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>내 강의</h2>
          <Link
            href="/instructor/courses"
            style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none', fontWeight: 500 }}
          >
            전체 관리 →
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: 16 }}>아직 등록한 강의가 없습니다.</p>
            <Link href="/instructor/courses/new">
              <button className="btn-primary" style={{ padding: '10px 24px' }}>
                첫 강의 만들기
              </button>
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 16,
            }}
          >
            {courses.slice(0, 6).map((course) => (
              <Link
                key={course.id}
                href={`/instructor/courses/${course.id}/lectures`}
                style={{ textDecoration: 'none' }}
              >
                <div className="card" style={{ padding: 20, cursor: 'pointer' }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 10,
                    }}
                  >
                    <span className={`badge ${DIFFICULTY_CLASS[course.difficulty] || 'badge-beginner'}`}>
                      {DIFFICULTY_LABEL[course.difficulty] || course.difficulty}
                    </span>
                    {course.lecture_count !== undefined && (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                        강의 {course.lecture_count}개
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#ffffff' }}>
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
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
