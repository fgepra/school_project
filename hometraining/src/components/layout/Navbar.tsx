// src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, isAuthenticated } = useAuth();

  const navLinks = [
    { href: '/dashboard', label: '대시보드' },
    { href: '/courses', label: '강의 목록' },
  ];

  const handleDashboardAccess = (e: MouseEvent<HTMLAnchorElement>) => {
    // 인증 상태 복원 중에는 가로채지 않음
    if (isLoading || isAuthenticated) return;

    // 비로그인일 때 안내 후 이동
    e.preventDefault();
    const ok = window.confirm('로그인이 필요한 서비스입니다');
    if (ok) router.push('/login');
    else router.push('/courses');
  };

  return (
    <nav
      style={{
        background: 'var(--bg-card)',
        borderBottom: '1px solid var(--border)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          height: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* 로고 */}
        <Link
          href="/dashboard"
          style={{ textDecoration: 'none' }}
          onClick={handleDashboardAccess}
        >
          <span
            style={{
              fontFamily: "'Bebas Neue', sans-serif",
              fontSize: 24,
              color: 'var(--accent)',
              letterSpacing: 2,
            }}
          >
            HOMEFIT
          </span>
        </Link>

        {/* 네비게이션 링크 */}
        <div style={{ display: 'flex', gap: 4 }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={link.href === '/dashboard' ? handleDashboardAccess : undefined}
                style={{
                  padding: '6px 14px',
                  borderRadius: 6,
                  fontSize: 14,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-elevated)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* 유저 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user && (
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              {user.name}님
            </span>
          )}
          {user && (
            <button
              className="btn-ghost"
              style={{ padding: '6px 14px', fontSize: 13 }}
              onClick={logout}
            >
              로그아웃
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
