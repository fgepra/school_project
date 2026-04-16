// src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';

const ROLE_LABEL: Record<string, string> = {
  student: '학생',
  instructor: '강사',
  admin: '관리자',
};

const ROLE_COLOR: Record<string, string> = {
  student: 'var(--text-secondary)',
  instructor: '#60a5fa',
  admin: 'var(--accent)',
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, isAuthenticated, role, isAdmin, isInstructor } = useAuth();

  // 역할별 네비게이션 링크 구성
  const getNavLinks = () => {
    if (isAdmin) {
      return [
        { href: '/admin', label: '관리 대시보드' },
        { href: '/admin/users', label: '유저 관리' },
        { href: '/courses', label: '강의 목록' },
      ];
    }
    if (isInstructor) {
      return [
        { href: '/instructor', label: '강사 대시보드' },
        { href: '/instructor/courses', label: '강의 관리' },
        { href: '/courses', label: '강의 목록' },
      ];
    }
    return [
      { href: '/dashboard', label: '대시보드' },
      { href: '/courses', label: '강의 목록' },
    ];
  };

  const navLinks = getNavLinks();

  const handleDashboardAccess = (e: MouseEvent<HTMLAnchorElement>) => {
    if (isLoading || isAuthenticated) return;
    e.preventDefault();
    const ok = window.confirm('로그인이 필요한 서비스입니다');
    if (ok) router.push('/login');
    else router.push('/courses');
  };

  const isStudentDashboardLink = (href: string) => href === '/dashboard';

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
          href={isAuthenticated ? (isAdmin ? '/admin' : isInstructor ? '/instructor' : '/dashboard') : '/courses'}
          style={{ textDecoration: 'none' }}
          onClick={!isAuthenticated ? handleDashboardAccess : undefined}
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
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={isStudentDashboardLink(link.href) ? handleDashboardAccess : undefined}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: ROLE_COLOR[role],
                  background: 'var(--bg-elevated)',
                  padding: '3px 8px',
                  borderRadius: 20,
                  border: `1px solid ${ROLE_COLOR[role]}40`,
                }}
              >
                {ROLE_LABEL[role]}
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {user.name}님
              </span>
            </div>
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
