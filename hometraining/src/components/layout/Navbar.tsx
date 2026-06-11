// src/components/layout/Navbar.tsx
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { notificationApi } from '@/lib/api';
import { Notification } from '@/types';

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

const TYPE_ICON: Record<string, string> = {
  payment: '💳',
  course_update: '📚',
  progress: '🏃',
  system: '🔔',
};

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading, isAuthenticated, role, isAdmin, isInstructor } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 알림 미읽음 수 폴링
  useEffect(() => {
    if (!user) return;
    const fetchCount = async () => {
      try {
        const res = await notificationApi.getUnreadCount();
        setUnreadCount(res.data?.count ?? 0);
      } catch {}
    };
    fetchCount();
    const timer = setInterval(fetchCount, 30000);
    return () => clearInterval(timer);
  }, [user]);

  // 드롭다운 열기 시 알림 목록 불러오기
  const handleBellClick = async () => {
    if (!showDropdown) {
      try {
        const res = await notificationApi.getAll();
        setNotifications((res.data ?? []).slice(0, 10));
      } catch {}
    }
    setShowDropdown(v => !v);
  };

  // 드롭다운 외부 클릭 닫기
  useEffect(() => {
    const handler = (e: globalThis.MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    await notificationApi.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
    setUnreadCount(c => Math.max(0, c - 1));
  };

  const handleMarkAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 as 1 })));
    setUnreadCount(0);
  };

  const getNavLinks = () => {
    if (isAdmin) {
      return [
        { href: '/admin', label: '대시보드' },
        { href: '/admin/users', label: '유저 관리' },
        { href: '/admin/settlement', label: '정산' },
        { href: '/admin/logs', label: '로그' },
        { href: '/admin/monitor', label: '모니터링' },
        { href: '/courses', label: '강의 목록' },
      ];
    }
    if (isInstructor) {
      return [
        { href: '/instructor', label: '강사 대시보드' },
        { href: '/instructor/courses', label: '강의 관리' },
        { href: '/instructor/settlement', label: '정산' },
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
        <div style={{ display: 'flex', gap: 2, flexWrap: 'nowrap', overflowX: 'auto' }}>
          {navLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + '/');
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={isStudentDashboardLink(link.href) ? handleDashboardAccess : undefined}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: isActive ? 700 : 400,
                  color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--bg-elevated)' : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  whiteSpace: 'nowrap',
                }}
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* 유저 영역 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            <div ref={dropdownRef} style={{ position: 'relative' }}>
              <button
                onClick={handleBellClick}
                style={{
                  position: 'relative', width: 36, height: 36, borderRadius: 8,
                  border: '1px solid var(--border)', background: 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18,
                }}
                title="알림"
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: -4, right: -4,
                    background: 'var(--accent)', color: '#fff',
                    fontSize: 10, fontWeight: 700, borderRadius: 10,
                    padding: '1px 5px', minWidth: 16, textAlign: 'center',
                  }}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* 알림 드롭다운 */}
              {showDropdown && (
                <div style={{
                  position: 'absolute', right: 0, top: 44, width: 340,
                  background: 'var(--bg-card)', border: '1px solid var(--border)',
                  borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
                  zIndex: 100, overflow: 'hidden',
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>알림</span>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllAsRead} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: 12, cursor: 'pointer' }}>
                        모두 읽음
                      </button>
                    )}
                  </div>
                  <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                    {notifications.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: 13 }}>알림이 없습니다.</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id}
                          onClick={() => !n.is_read && handleMarkAsRead(n.id)}
                          style={{
                            padding: '12px 16px', borderBottom: '1px solid var(--border)',
                            display: 'flex', gap: 10, alignItems: 'flex-start', cursor: !n.is_read ? 'pointer' : 'default',
                            background: !n.is_read ? 'rgba(99,102,241,0.06)' : 'transparent',
                          }}
                        >
                          <span style={{ fontSize: 18 }}>{TYPE_ICON[n.type] ?? '🔔'}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: n.is_read ? 400 : 700, marginBottom: 2 }}>{n.title}</div>
                            {n.message && <div style={{ fontSize: 12, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>}
                          </div>
                          {!n.is_read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', marginTop: 4, flexShrink: 0 }} />}
                        </div>
                      ))
                    )}
                  </div>
                  <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                    <Link href="/notifications" onClick={() => setShowDropdown(false)} style={{ fontSize: 13, color: 'var(--primary)', textDecoration: 'none' }}>
                      전체 알림 보기
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          {user && (
            <Link
              href="/settings"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--text-secondary)', textDecoration: 'none',
                fontSize: 16, transition: 'all 0.15s',
              }}
              title="설정"
            >⚙️</Link>
          )}
          {user && (
            <button
              className="btn-ghost"
              style={{ padding: '6px 12px', fontSize: 13 }}
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
