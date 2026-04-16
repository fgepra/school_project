// src/app/(auth)/signup/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

export default function SignupPage() {
  const router = useRouter();
  const { signup, getDefaultPath } = useAuth();

  const [form, setForm] = useState({
    email: '',
    password: '',
    passwordConfirm: '',
    name: '',
    weight: '',
    role: 'student' as UserRole,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (form.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await signup({
        email: form.email,
        password: form.password,
        name: form.name,
        weight: form.weight ? Number(form.weight) : undefined,
        role: form.role,
      });
      router.replace(getDefaultPath(result.user.role));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm({ ...form, [key]: e.target.value }),
  });

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
            지금 바로 시작하세요
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24 }}>회원가입</h2>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* 역할 선택 */}
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
                가입 유형
              </label>
              <div style={{ display: 'flex', gap: 8 }}>
                {([
                  { value: 'student', label: '학생' },
                  { value: 'instructor', label: '강사' },
                ] as { value: UserRole; label: string }[]).map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setForm({ ...form, role: value })}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: 8,
                      border: `1px solid ${form.role === value ? 'var(--accent)' : 'var(--border)'}`,
                      background: form.role === value ? 'var(--accent-dim)' : 'var(--bg-elevated)',
                      color: form.role === value ? 'var(--accent)' : 'var(--text-secondary)',
                      fontWeight: form.role === value ? 700 : 400,
                      cursor: 'pointer',
                      fontSize: 14,
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {[
              { key: 'name', label: '이름', type: 'text', placeholder: '홍길동' },
              { key: 'email', label: '이메일', type: 'email', placeholder: 'example@email.com' },
              { key: 'password', label: '비밀번호', type: 'password', placeholder: '6자 이상' },
              { key: 'passwordConfirm', label: '비밀번호 확인', type: 'password', placeholder: '비밀번호 재입력' },
              { key: 'weight', label: '체중 (kg, 선택)', type: 'number', placeholder: '70' },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                  {label}
                </label>
                <input
                  className="input-field"
                  type={type}
                  placeholder={placeholder}
                  required={key !== 'weight'}
                  min={key === 'weight' ? 1 : undefined}
                  {...field(key as keyof typeof form)}
                />
              </div>
            ))}

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
              {isLoading ? '처리 중...' : '회원가입'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text-secondary)' }}>
            이미 계정이 있으신가요?{' '}
            <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 700 }}>
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
