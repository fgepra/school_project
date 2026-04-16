// src/app/(auth)/login/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const router = useRouter();
  const { login, getDefaultPath } = useAuth();

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await login(form);
      router.replace(getDefaultPath(result.user.role));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div className="fade-in" style={{ width: '100%', maxWidth: 420 }}>
        {/* 로고 */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 48,
              color: 'var(--accent)',
              letterSpacing: 4,
              lineHeight: 1,
            }}
          >
            HOMEFIT
          </h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 8, fontSize: 14 }}>
            집에서 배우는 체계적인 운동
          </p>
        </div>

        {/* 카드 */}
        <div
          className="card"
          style={{ padding: 32 }}
        >
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>로그인</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                이메일
              </label>
              <input
                className="input-field"
                type="email"
                placeholder="example@email.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                비밀번호
              </label>
              <input
                className="input-field"
                type="password"
                placeholder="비밀번호 입력"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
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

            <button
              className="btn-primary"
              type="submit"
              disabled={isLoading}
              style={{ marginTop: 8, padding: '13px', fontSize: 15 }}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            계정이 없으신가요?{' '}
            <Link href="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
