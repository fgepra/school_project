// src/app/(main)/instructor/courses/new/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { instructorApi } from '@/lib/api';

export default function NewCoursePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    met_value: '3.0',
    thumbnail: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await instructorApi.createCourse({
        title: form.title,
        description: form.description,
        difficulty: form.difficulty,
        met_value: form.met_value ? Number(form.met_value) : undefined,
        thumbnail: form.thumbnail || undefined,
      });
      // 생성 후 해당 강의의 영상 관리 페이지로 이동
      router.replace(`/instructor/courses/${result.courseId}/lectures`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '강의 생성에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <Link
          href="/instructor/courses"
          style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          ← 강의 목록으로
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 16 }}>새 강의 만들기</h1>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* 제목 */}
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              강의 제목 *
            </label>
            <input
              className="input-field"
              type="text"
              placeholder="예: 홈트 기초 체력 강화 프로그램"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>

          {/* 설명 */}
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              강의 설명 *
            </label>
            <textarea
              placeholder="강의에 대한 간단한 설명을 입력하세요."
              required
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              style={{
                width: '100%',
                background: 'var(--bg-elevated)',
                border: '1px solid var(--border)',
                borderRadius: 8,
                padding: '10px 14px',
                color: 'var(--text-primary)',
                fontSize: 14,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* 난이도 */}
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              난이도 *
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              {([
                { value: 'beginner', label: '초급' },
                { value: 'intermediate', label: '중급' },
                { value: 'advanced', label: '고급' },
              ] as { value: typeof form.difficulty; label: string }[]).map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, difficulty: value })}
                  style={{
                    flex: 1,
                    padding: '10px',
                    borderRadius: 8,
                    border: `1px solid ${form.difficulty === value ? 'var(--accent)' : 'var(--border)'}`,
                    background: form.difficulty === value ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                    color: form.difficulty === value ? 'var(--accent)' : 'var(--text-secondary)',
                    fontWeight: form.difficulty === value ? 700 : 400,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* MET 값 */}
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              MET 값 (운동 강도, 기본값: 3.0)
            </label>
            <input
              className="input-field"
              type="number"
              step="0.1"
              min="1"
              max="20"
              placeholder="3.0"
              value={form.met_value}
              onChange={(e) => setForm({ ...form, met_value: e.target.value })}
            />
          </div>

          {/* 썸네일 URL */}
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
              썸네일 URL (선택)
            </label>
            <input
              className="input-field"
              type="url"
              placeholder="https://example.com/thumbnail.jpg"
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
            />
          </div>

          {error && (
            <p
              style={{
                fontSize: 13,
                color: 'var(--accent)',
                background: 'var(--accent-dim)',
                padding: '10px 14px',
                borderRadius: 8,
              }}
            >
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <Link href="/instructor/courses" style={{ flex: 1 }}>
              <button
                type="button"
                className="btn-ghost"
                style={{ width: '100%', padding: '13px' }}
              >
                취소
              </button>
            </Link>
            <button
              className="btn-primary"
              type="submit"
              disabled={isLoading}
              style={{ flex: 2, padding: '13px', fontSize: 15 }}
            >
              {isLoading ? '생성 중...' : '강의 만들기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
