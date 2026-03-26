// src/app/(main)/courses/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { courseApi } from '@/lib/api';
import { Course } from '@/types';

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

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    courseApi
      .getAll()
      .then(setCourses)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = courses.filter((c) => {
    const matchDiff = filter === '' || c.difficulty === filter;
    const matchSearch =
      search === '' ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description?.toLowerCase().includes(search.toLowerCase());
    return matchDiff && matchSearch;
  });

  return (
    <div className="fade-in">
      {/* 헤더 */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>강의 목록</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
          총 {courses.length}개의 강의
        </p>
      </div>

      {/* 필터 & 검색 */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          marginBottom: 28,
          flexWrap: 'wrap',
        }}
      >
        <input
          className="input-field"
          style={{ flex: 1, minWidth: 200 }}
          placeholder="강의 제목 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <div style={{ display: 'flex', gap: 8 }}>
          {DIFFICULTIES.map((d) => (
            <button
              key={d.value}
              onClick={() => setFilter(d.value)}
              style={{
                padding: '8px 16px',
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
      </div>

      {/* 강의 그리드 */}
      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
          <div className="spinner" />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="card"
          style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}
        >
          검색 결과가 없습니다.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 20,
          }}
        >
          {filtered.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              style={{ textDecoration: 'none' }}
            >
              <div
                className="card"
                style={{ padding: 24, cursor: 'pointer', height: '100%' }}
              >
                {/* 썸네일 */}
                <div
                  style={{
                    height: 140,
                    background: 'var(--bg-elevated)',
                    borderRadius: 8,
                    marginBottom: 18,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 44,
                  }}
                >
                  🏋️
                </div>

                {/* 메타 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span className={`badge ${difficultyClass[course.difficulty] || 'badge-beginner'}`}>
                    {difficultyLabel[course.difficulty] || course.difficulty}
                  </span>
                  {course.lecture_count !== undefined && (
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                      강의 {course.lecture_count}개
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
                  {course.title}
                </h3>
                <p
                  style={{
                    fontSize: 13,
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
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
  );
}
