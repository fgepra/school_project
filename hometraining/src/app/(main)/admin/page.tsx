// src/app/(main)/admin/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminApi } from '@/lib/api';
import { AdminStats } from '@/types';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    adminApi.getStats()
      .then(setStats)
      .catch(() => setError('통계를 불러오는데 실패했습니다.'))
      .finally(() => setIsLoading(false));
  }, []);

  const roleLabel: Record<string, string> = {
    student: '학생',
    instructor: '강사',
    admin: '관리자',
  };

  const roleColor: Record<string, string> = {
    student: 'var(--text-secondary)',
    instructor: '#60a5fa',
    admin: 'var(--accent)',
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 40 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>관리자 대시보드</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 15 }}>
          시스템 현황을 한눈에 확인하세요.
        </p>
      </div>

      {error && (
        <div className="card" style={{ padding: 24, color: 'var(--accent)', marginBottom: 24 }}>
          {error}
        </div>
      )}

      {/* 통계 카드 */}
      {stats && (
        <>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 16,
              marginBottom: 40,
            }}
          >
            {[
              { label: '전체 유저', value: stats.totalUsers, icon: '👥' },
              { label: '전체 강의', value: stats.totalCourses, icon: '📚' },
              { label: '전체 강의 영상', value: stats.totalLectures, icon: '🎬' },
              { label: '완료된 진도', value: stats.completedProgress, icon: '✅' },
            ].map((stat) => (
              <div key={stat.label} className="card" style={{ padding: 24 }}>
                <div style={{ fontSize: 28, marginBottom: 12 }}>{stat.icon}</div>
                <div style={{ fontSize: 26, fontWeight: 700 }}>{stat.value}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* 역할별 유저 분포 */}
          <div className="card" style={{ padding: 24, marginBottom: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>역할별 유저 분포</h2>
            <div style={{ display: 'flex', gap: 24 }}>
              {stats.roleStats.map((rs) => (
                <div key={rs.role} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: roleColor[rs.role] || 'var(--text-secondary)',
                    }}
                  />
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                    {roleLabel[rs.role] || rs.role}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 700 }}>{rs.count}명</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 빠른 메뉴 */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>관리 메뉴</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
          {[
            {
              href: '/admin/users',
              icon: '👥',
              title: '유저 관리',
              desc: '전체 유저 목록 조회 및 역할 변경',
            },
            {
              href: '/courses',
              icon: '📚',
              title: '강의 목록',
              desc: '전체 강의 목록 확인',
            },
            {
              href: '/admin/courses',
              icon: '🎓',
              title: '강의 관리',
              desc: '전체 강의 생성, 수정, 삭제',
            },
          ].map((menu) => (
            <Link key={menu.href} href={menu.href} style={{ textDecoration: 'none' }}>
              <div
                className="card"
                style={{ padding: 24, cursor: 'pointer', transition: 'border-color 0.15s' }}
              >
                <div style={{ fontSize: 32, marginBottom: 12 }}>{menu.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>{menu.title}</h3>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{menu.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
