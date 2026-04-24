// src/app/(main)/instructor/courses/[courseId]/edit/page.tsx
'use client';

import { useEffect, useState, FormEvent, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { courseApi, instructorApi } from '@/lib/api';
import { Course } from '@/types';

const BACKEND_URL = 'http://localhost:5000';

export default function EditCoursePage() {
  const router = useRouter();
  const { courseId } = useParams<{ courseId: string }>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    met_value: '3.0',
  });
  // 기존 서버에 저장된 썸네일 경로 (e.g. "/uploads/thumbnails/xxx.jpg")
  const [existingThumbnail, setExistingThumbnail] = useState<string>('');
  // 새로 선택한 파일
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  // 미리보기 URL (new File → blob URL, 기존 → backend URL)
  const [previewUrl, setPreviewUrl] = useState<string>('');

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
        });
        if (course.thumbnail) {
          setExistingThumbnail(course.thumbnail);
          setPreviewUrl(`${BACKEND_URL}${course.thumbnail}`);
        }
      })
      .catch(() => setError('강의 정보를 불러오는데 실패했습니다.'))
      .finally(() => setIsFetching(false));
  }, [courseId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    setThumbnailFile(file);
    setExistingThumbnail(''); // 기존 썸네일 대체
    setError('');
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setThumbnailFile(null);
    setExistingThumbnail('');
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('difficulty', form.difficulty);
      formData.append('met_value', form.met_value);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      await instructorApi.updateCourse(Number(courseId), formData);
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

          {/* 제목 */}
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>강의 제목 *</label>
            <input className="input-field" type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>

          {/* 설명 */}
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
                fontFamily: "'Noto Sans KR', sans-serif",
              }}
            />
          </div>

          {/* 난이도 */}
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
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* MET 값 */}
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>MET 값</label>
            <input className="input-field" type="number" step="0.1" min="1" max="20" value={form.met_value} onChange={(e) => setForm({ ...form, met_value: e.target.value })} />
          </div>

          {/* 썸네일 이미지 */}
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              썸네일 이미지 (JPG·PNG·WEBP·GIF · 최대 5MB)
            </label>

            {previewUrl ? (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                <img
                  src={previewUrl}
                  alt="썸네일 미리보기"
                  style={{
                    width: '100%',
                    maxWidth: 320,
                    height: 180,
                    objectFit: 'cover',
                    borderRadius: 10,
                    border: '1px solid var(--border)',
                    display: 'block',
                  }}
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(0,0,0,0.65)',
                    border: 'none',
                    color: '#fff',
                    fontSize: 14,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                  title="이미지 제거"
                >
                  ✕
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    marginTop: 8,
                    padding: '6px 14px',
                    borderRadius: 8,
                    background: 'transparent',
                    border: '1px solid var(--border)',
                    color: 'var(--text-secondary)',
                    fontSize: 12,
                    cursor: 'pointer',
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                >
                  이미지 변경
                </button>
                {thumbnailFile && (
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {thumbnailFile.name}
                  </p>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border)',
                  borderRadius: 10,
                  padding: '32px 20px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                  background: 'var(--bg-elevated)',
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--accent)';
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--accent-dim)';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
                  (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)';
                }}
              >
                <div style={{ fontSize: 36, marginBottom: 10 }}>🖼️</div>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 4 }}>
                  클릭하여 이미지 선택
                </p>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                  JPG, PNG, WEBP, GIF · 최대 5MB
                </p>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
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
