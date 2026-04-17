// src/app/(main)/courses/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { courseApi } from '@/lib/api';
import { MOCK_COURSES } from '@/lib/mockData';
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

// 강의 id 기반으로 고정된 썸네일 배경색 지정 (업로드 이미지 없을 때 폴백)
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

// MET 값에 따른 강도 설명
function getIntensityLabel(met: number): string {
  if (met < 3.5) return '저강도';
  if (met < 6.0) return '중강도';
  return '고강도';
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMock, setIsMock] = useState(false);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    courseApi
      .getAll()
      .then((data) => {
        // API에서 데이터가 없으면 mock으로 폴백
        if (data.length === 0) {
          setCourses(MOCK_COURSES);
          setIsMock(true);
        } else {
          setCourses(data);
        }
      })
      .catch(() => {
        // API 연결 실패 시 mock 데이터 사용
        setCourses(MOCK_COURSES);
        setIsMock(true);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const DIFFICULTY_ORDER: Record<string, number> = {
    beginner: 0,
    intermediate: 1,
    advanced: 2,
  };

  const filtered = courses
    .filter((c) => {
      const matchDiff = filter === '' || c.difficulty === filter;
      const matchSearch =
        search === '' ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase());
      return matchDiff && matchSearch;
    })
    .sort((a, b) => {
      const da = DIFFICULTY_ORDER[a.difficulty] ?? 99;
      const db = DIFFICULTY_ORDER[b.difficulty] ?? 99;
      if (da !== db) return da - db;
      return a.id - b.id;
    });

  return (
    <div className="fade-in">
      {/* 헤더 */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700 }}>강의 목록</h1>
        </div>
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
          {filtered.map((course) => {
            return (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="card"
                  style={{
                    padding: 0,
                    cursor: 'pointer',
                    height: '100%',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  {/* 썸네일: 업로드 이미지 우선, 없으면 그라디언트 배경만 */}
                  <div
                    style={{
                      height: 148,
                      background: course.thumbnail ? '#111' : getThumbnailBg(course.id),
                      position: 'relative',
                      flexShrink: 0,
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
                    {/* 강도 뱃지 오른쪽 하단 */}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: 10,
                        right: 12,
                        fontSize: 11,
                        padding: '2px 8px',
                        borderRadius: 20,
                        background: 'rgba(0,0,0,0.55)',
                        color: 'var(--text-secondary)',
                        backdropFilter: 'blur(4px)',
                      }}
                    >
                      {getIntensityLabel(course.met_value)} · MET {course.met_value}
                    </span>
                  </div>

                  {/* 콘텐츠 */}
                  <div style={{ padding: '18px 20px 22px', flex: 1, display: 'flex', flexDirection: 'column' }}>
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

                    <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8, lineHeight: 1.4, color: '#ffffff' }}>
                      {course.title}
                    </h3>
                    <p
                      style={{
                        fontSize: 13,
                        color: 'var(--text-secondary)',
                        lineHeight: 1.65,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        flex: 1,
                      }}
                    >
                      {course.description}
                    </p>

                    {/* 수강 시작 링크 힌트 */}
                    <div
                      style={{
                        marginTop: 16,
                        fontSize: 13,
                        color: 'var(--accent)',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      수강 시작하기
                      <span style={{ fontSize: 11 }}>→</span>
                    </div>
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
