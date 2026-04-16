// src/app/(main)/instructor/courses/[courseId]/edit/page.tsx
'use client';

import { useEffect, useState, FormEvent } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { courseApi, instructorApi } from '@/lib/api';
import { Course } from '@/types';

export default function EditCoursePage() {
  const router = useRouter();
  const { courseId } = useParams<{ courseId: string }>();
  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    met_value: '3.0',
    thumbnail: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    courseApi.getById(Number(courseId))
      .then((course: Course) => {
        setForm({
          title: course.title,
          description: course.description,
          difficulty: course.difficulty,
          met_value: String(course.met_value),
          thumbnail: course.thumbnail || '',
        });
      })
      .catch(() => setError('강의 정보를 불러오는데 실패했습니다.'))
      .finally(() => setIsFetching(false));
  }, [courseId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await instructorApi.updateCourse(Number(courseId), {
        title: form.title,
        description: form.description,
        difficulty: form.difficulty,
        met_value: Number(form.met_value),
        thumbnail: form.thumbnail || undefined,
      });
      router.replace('/instructor/courses');
    } catch (err) {
      setError(err instanceof Error ? err.message : '수정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
      <div style={{ marginBottom: 32 }}>
        <Link
          href="/instructor/courses"
          style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'none' }}
        >
          ← 강의 목록으로
        </Link>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 16 }}>강의 수정</h1>
      </div>

      <div className="card" style={{ padding: 32 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>강의 제목 *</label>
            <input className="input-field" type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>강의 설명 *</label>
            <textarea
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

          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>난이도 *</label>
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

          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>MET 값</label>
            <input className="input-field" type="number" step="0.1" min="1" max="20" value={form.met_value} onChange={(e) => setForm({ ...form, met_value: e.target.value })} />
          </div>

          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>썸네일 URL (선택)</label>
            <input className="input-field" type="url" value={form.thumbnail} onChange={(e) => setForm({ ...form, thumbnail: e.target.value })} />
          </div>

          {error && (
            <p style={{ fontSize: 13, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '10px 14px', borderRadius: 8 }}>
              {error}
            </p>
          )}

          <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
            <Link href="/instructor/courses" style={{ flex: 1 }}>
              <button type="button" className="btn-ghost" style={{ width: '100%', padding: '13px' }}>취소</button>
            </Link>
            <button className="btn-primary" type="submit" disabled={isLoading} style={{ flex: 2, padding: '13px', fontSize: 15 }}>
              {isLoading ? '저장 중...' : '저장하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
