// src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import type { MouseEvent } from 'react';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { notificationApi } from '@/lib/api';
import type { Notification } from '@/types';

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

  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // 미읽음 수 폴링 (30초마다)
  useEffect(() => {
    if (!user) return;
    const fetchCount = () => {
      notificationApi.getUnreadCount().then((res) => setUnreadCount(res.data.count)).catch(() => {});
    };
    fetchCount();
    const timer = setInterval(fetchCount, 30000);
    return () => clearInterval(timer);
  }, [user]);

  // 벨 바깥 클릭 시 닫기
  useEffect(() => {
    const handler = (e: globalThis.MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleBellClick = () => {
    if (!bellOpen) {
      notificationApi.getAll().then((res) => setNotifications(res.data)).catch(() => {});
    }
    setBellOpen((prev) => !prev);
  };

  const handleMarkRead = async (id: number) => {
    await notificationApi.markAsRead(id).catch(() => {});
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, is_read: 1 } : n));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead().catch(() => {});
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
    setUnreadCount(0);
  };

  // 역할별 네비게이션 링크 구성
  const getNavLinks = () => {
    if (isAdmin) {
      return [
        { href: '/admin', label: '관리 대시보드' },
        { href: '/admin/users', label: '유저 관리' },
        { href: '/admin/settlement', label: '매출/정산' },
        { href: '/admin/logs', label: '로그' },
        { href: '/admin/monitor', label: '모니터링' },
        { href: '/courses', label: '강의 목록' },
      ];
    }
    if (isInstructor) {
      return [
        { href: '/instructor', label: '강사 대시보드' },
        { href: '/instructor/courses', label: '강의 관리' },
        { href: '/instructor/settlement', label: '정산 내역' },
        { href: '/courses', label: '강의 목록' },
      ];
    }
    return [
      { href: '/dashboard', label: '대시보드' },
      { href: '/courses', label: '강의 목록' },
      { href: '/motion', label: '모션 캡처' },
      { href: '/workout', label: '운동 기록' },
      { href: '/completed', label: '수강 완료' },
      { href: '/bookmarks', label: '즐겨찾기' },
      { href: '/payment/history', label: '결제 내역' },
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

          {/* 알림 벨 */}
          {user && (
            <div ref={bellRef} style={{ position: 'relative' }}>
              <button
                onClick={handleBellClick}
                style={{
                  position: 'relative',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontSize: 16,
                  color: 'var(--text-secondary)',
                }}
                title="알림"
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: -4,
                    right: -4,
                    background: 'var(--accent)',
                    color: '#fff',
                    fontSize: 10,
                    fontWeight: 700,
                    borderRadius: 10,
                    padding: '1px 5px',
                    minWidth: 16,
                    textAlign: 'center',
                    lineHeight: 1.4,
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* 알림 드롭다운 */}
              {bellOpen && (
                <div style={{
                  position: 'absolute',
                  top: 38,
                  right: 0,
                  width: 340,
                  maxHeight: 420,
                  overflowY: 'auto',
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: 10,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                  zIndex: 1000,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>알림</span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {unreadCount > 0 && (
                        <button onClick={handleMarkAllRead} style={{ fontSize: 11, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          모두 읽음
                        </button>
                      )}
                      <Link href="/notifications" onClick={() => setBellOpen(false)} style={{ fontSize: 11, color: 'var(--text-secondary)', textDecoration: 'none' }}>
                        전체 보기
                      </Link>
                    </div>
                  </div>
                  {notifications.length === 0 ? (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>알림이 없습니다.</div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => n.is_read === 0 && handleMarkRead(n.id)}
                        style={{
                          padding: '12px 16px',
                          borderBottom: '1px solid var(--border)',
                          background: n.is_read === 0 ? 'var(--bg-elevated)' : 'transparent',
                          cursor: n.is_read === 0 ? 'pointer' : 'default',
                        }}
                      >
                        <div style={{ fontSize: 13, fontWeight: n.is_read === 0 ? 700 : 400, color: 'var(--text-primary)', marginBottom: 3 }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{n.message}</div>
                        <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                          {new Date(n.created_at).toLocaleString('ko-KR')}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {user && (
            <Link
              href="/settings"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                fontSize: 16,
                transition: 'all 0.15s',
              }}
              title="설정"
            >
              ⚙️
            </Link>
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
