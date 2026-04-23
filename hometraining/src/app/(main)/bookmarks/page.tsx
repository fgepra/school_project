// src/app/(main)/bookmarks/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { bookmarkApi } from '@/lib/api';
import { BookmarkedCourse } from '@/types';

const BACKEND_URL = 'http://localhost:5000';

const THUMBNAIL_BG: Record<number, string> = {
  1: 'linear-gradient(135deg, #1a2a1a 0%, #0d1f0d 100%)',
  2: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d1f 100%)',
  3: 'linear-gradient(135deg, #2e1a1a 0%, #1f0d0d 100%)',
};

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

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkedCourse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    bookmarkApi
      .getAll()
      .then((data) => setBookmarks(data))
      .catch(() => setBookmarks([]))
      .finally(() => setIsLoading(false));
  }, []);

  const handleRemoveBookmark = async (courseId: number) => {
    try {
      await bookmarkApi.toggle(courseId);
      setBookmarks((prev) => prev.filter((b) => b.id !== courseId));
    } catch {
      // 실패 시 무시
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 28,
        }}
      >
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>즐겨찾기</h1>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
            총 {bookmarks.length}개
          </p>
        </div>
      </div>

      {/* 빈 상태 */}
      {bookmarks.length === 0 ? (
        <div
          className="card"
          style={{
            padding: 64,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div style={{ fontSize: 48 }}>★</div>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
            즐겨찾기한 강의가 없습니다
          </p>
          <Link href="/courses">
            <button className="btn-primary" style={{ marginTop: 8 }}>
              강의 둘러보기
            </button>
          </Link>
        </div>
      ) : (
        /* 강의 카드 그리드 */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}
        >
          {bookmarks.map((course) => {
            const thumbnailBg =
              THUMBNAIL_BG[course.id] ?? 'var(--bg-elevated)';

            return (
              <div
                key={course.bookmark_id}
                className="card"
                style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
              >
                {/* 썸네일 */}
                <Link href={`/courses/${course.id}`} style={{ textDecoration: 'none' }}>
                  <div
                    style={{
                      height: 160,
                      background: thumbnailBg,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {course.thumbnail && (
                      <img
                        src={`${BACKEND_URL}${course.thumbnail}`}
                        alt={course.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    )}
                  </div>
                </Link>

                {/* 카드 본문 */}
                <div style={{ padding: '16px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {/* 배지 + 북마크 해제 버튼 */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span className={`badge ${difficultyClass[course.difficulty] || 'badge-beginner'}`}>
                      {difficultyLabel[course.difficulty] || course.difficulty}
                    </span>
                    <button
                      onClick={() => handleRemoveBookmark(course.id)}
                      style={{
                        fontSize: 20,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#f59e0b',
                        transition: 'color 0.15s',
                        padding: 0,
                        lineHeight: 1,
                      }}
                      title="즐겨찾기 해제"
                    >
                      ♥
                    </button>
                  </div>

                  {/* 제목 */}
                  <Link href={`/courses/${course.id}`} style={{ textDecoration: 'none' }}>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        lineHeight: 1.4,
                        margin: 0,
                      }}
                    >
                      {course.title}
                    </h3>
                  </Link>

                  {/* 설명 */}
                  <p
                    style={{
                      fontSize: 13,
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {course.description}
                  </p>

                  {/* 메타 정보 */}
                  <div
                    style={{
                      marginTop: 'auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: 12,
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <span>강의 {course.lecture_count ?? 0}개</span>
                    {course.instructor_name && <span>{course.instructor_name}</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
