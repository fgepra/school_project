// src/app/(main)/instructor/courses/new/page.tsx
'use client';

import { useState, FormEvent, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { instructorApi } from '@/lib/api';

export default function NewCoursePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    title: '',
    description: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    met_value: '3.0',
  });
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 5MB 제한 검사
    if (file.size > 5 * 1024 * 1024) {
      setError('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }

    setThumbnailFile(file);
    setError('');

    // 미리보기 URL 생성
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleRemoveImage = () => {
    setThumbnailFile(null);
    setPreviewUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // FormData로 텍스트 필드 + 이미지 파일을 함께 전송
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('difficulty', form.difficulty);
      formData.append('met_value', form.met_value);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }

      const result = await instructorApi.createCourse(formData);
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
                fontFamily: "'Noto Sans KR', sans-serif",
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

          {/* 썸네일 이미지 업로드 */}
          <div>
            <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
              썸네일 이미지 (선택 · JPG·PNG·WEBP·GIF · 최대 5MB)
            </label>

            {previewUrl ? (
              /* 미리보기 */
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
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
                  {thumbnailFile?.name}
                </p>
              </div>
            ) : (
              /* 업로드 영역 */
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
              <button type="button" className="btn-ghost" style={{ width: '100%', padding: '13px' }}>
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
