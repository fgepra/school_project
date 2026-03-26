// src/app/(main)/layout.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import Navbar from '@/components/layout/Navbar';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || isAuthenticated) return;

    // 비로그인 상태에서는 강의 목록 페이지만 공개
    const isCoursesListRoute = pathname === '/courses';
    if (isCoursesListRoute) return;

    if (pathname?.startsWith('/dashboard')) {
      const ok = window.confirm('로그인이 필요한 서비스입니다');
      if (ok) router.replace('/login');
      else router.replace('/courses');
      return;
    }

    router.replace('/login');
  }, [isAuthenticated, isLoading, pathname, router]);

  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg)',
        }}
      >
        <div className="spinner" />
      </div>
    );
  }

  // 비로그인일 때 `/courses`만 렌더링
  if (!isAuthenticated && pathname !== '/courses') return null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>
        {children}
      </main>
    </div>
  );
}
