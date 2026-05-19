// src/app/(main)/instructor/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { instructorApi, settlementApi } from '@/lib/api';
import { Course } from '@/types';
import { useAuth } from '@/hooks/useAuth';

const DIFFICULTY_LABEL: Record<string, string> = {
  beginner: '초급',
  intermediate: '중급',
  advanced: '고급',
};
const DIFFICULTY_CLASS: Record<string, string> = {
  beginner: 'badge-beginner',
  intermediate: 'badge-intermediate',
  advanced: 'badge-advanced',
};

interface MonthStat {
  month: string;
  sales_count: number;
  total_revenue: number;
  payout_amount: number;
}

// 이번 달 YYYY-MM
function thisMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}
// 지난달
function lastMonth(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function InstructorDashboardPage() {
  const { user } = useAuth();
  const [courses, setCourses]         = useState<Course[]>([]);
  const [monthlyStats, setMonthly]    = useState<MonthStat[]>([]);
  const [isLoading, setIsLoading]     = useState(true);

  // 정산 신청 상태
  const [requestPeriod, setRequestPeriod]   = useState(lastMonth());
  const [requesting, setRequesting]         = useState(false);
  const [requestMsg, setRequestMsg]         = useState('');
  const [requestError, setRequestError]     = useState('');

  useEffect(() => {
    Promise.allSettled([
      instructorApi.getMyCourses(),
      settlementApi.getInstructorMonthlyStats(),
    ]).then(([coursesResult, statsResult]) => {
      if (coursesResult.status === 'fulfilled') {
        setCourses(coursesResult.value);
      }
      if (statsResult.status === 'fulfilled') {
        setMonthly(statsResult.value.data ?? []);
      }
    }).finally(() => setIsLoading(false));
  }, []);

  const handleRequestSettlement = async () => {
    if (!requestPeriod) return;
    setRequesting(true);
    setRequestMsg('');
    setRequestError('');
    try {
      const res = await settlementApi.requestSettlement(requestPeriod);
      setRequestMsg(res.message ?? '정산 신청이 완료됐습니다.');
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : '정산 신청에 실패했습니다.');
    } finally {
      setRequesting(false);
    }
  };

  // 이번 달 / 저번 달 통계
  const tm = thisMonth();
  const lm = lastMonth();
  const thisStat = monthlyStats.find(s => s.month === tm);
  const lastStat = monthlyStats.find(s => s.month === lm);
  const totalRevenue = monthlyStats.reduce((a, s) => a + s.total_revenue, 0);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* 헤더 */}
      <div style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>
          안녕하세요, <span style={{ color: 'var(--accent)' }}>{user?.name}</span> 강사님
        </h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 15 }}>
          강의 현황과 수익을 한눈에 확인하세요.
        </p>
      </div>

      {/* ── 상단 요약 카드 ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 36 }}>
        {[
          { icon: '📚', label: '담당 강의', value: `${courses.length}개` },
          { icon: '🎬', label: '전체 영상', value: `${courses.reduce((s, c) => s + (c.lecture_count || 0), 0)}개` },
          { icon: '💰', label: '이번 달 매출', value: thisStat ? `₩${thisStat.total_revenue.toLocaleString()}` : '₩0' },
          { icon: '💵', label: '이번 달 정산액', value: thisStat ? `₩${thisStat.payout_amount.toLocaleString()}` : '₩0', accent: true },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: '20px 22px' }}>
            <div style={{ fontSize: 26, marginBottom: 10 }}>{stat.icon}</div>
            <div style={{
              fontSize: 22, fontWeight: 700,
              color: stat.accent ? '#22c55e' : 'var(--text-primary)',
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20, marginBottom: 36 }}>
        {/* ── 월별 수익 테이블 ── */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>월별 수익 현황</h2>
            <Link href="/instructor/settlement" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
              정산 내역 전체 보기 →
            </Link>
          </div>

          {monthlyStats.length === 0 ? (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
              <p>아직 매출 데이터가 없습니다.</p>
            </div>
          ) : (
            <div className="card" style={{ overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                    {['기간', '판매 건수', '총 매출', '정산액 (70%)'].map(h => (
                      <th key={h} style={{
                        padding: '11px 16px', textAlign: 'left',
                        fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthlyStats.map((s, i) => {
                    const isThis = s.month === tm;
                    const isLast = s.month === lm;
                    return (
                      <tr
                        key={s.month}
                        style={{
                          borderBottom: i < monthlyStats.length - 1 ? '1px solid var(--border)' : 'none',
                          background: isThis ? 'rgba(var(--accent-rgb, 239 68 68) / 0.06)' : 'transparent',
                        }}
                      >
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>
                          {s.month}
                          {isThis && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--accent)', background: 'var(--accent-dim)', padding: '2px 8px', borderRadius: 10 }}>이번 달</span>}
                          {isLast && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-secondary)', background: 'var(--bg-elevated)', padding: '2px 8px', borderRadius: 10 }}>지난달</span>}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{s.sales_count}건</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>₩{s.total_revenue.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700, color: '#22c55e' }}>₩{s.payout_amount.toLocaleString()}</td>
                      </tr>
                    );
                  })}
                  {/* 합계 행 */}
                  <tr style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)' }}>
                    <td style={{ padding: '11px 16px', fontWeight: 700, fontSize: 13 }}>전체 합계</td>
                    <td style={{ padding: '11px 16px', color: 'var(--text-secondary)' }}>
                      {monthlyStats.reduce((a, s) => a + s.sales_count, 0)}건
                    </td>
                    <td style={{ padding: '11px 16px', fontWeight: 700 }}>₩{totalRevenue.toLocaleString()}</td>
                    <td style={{ padding: '11px 16px', fontWeight: 700, color: '#22c55e' }}>
                      ₩{monthlyStats.reduce((a, s) => a + s.payout_amount, 0).toLocaleString()}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── 정산 신청 패널 ── */}
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>정산 신청</h2>
          <div className="card" style={{ padding: 24 }}>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 20 }}>
              정산을 원하는 월을 선택하고 신청하세요.<br />
              매출의 <strong style={{ color: '#22c55e' }}>70%</strong>가 정산액으로 처리됩니다.
            </p>

            {/* 월 선택 */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>
                정산 기간 선택
              </label>
              <input
                type="month"
                value={requestPeriod}
                max={lastMonth()}
                onChange={e => { setRequestPeriod(e.target.value); setRequestMsg(''); setRequestError(''); }}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  borderRadius: 8, padding: '10px 14px',
                  color: 'var(--text-primary)', fontSize: 14,
                  outline: 'none', fontFamily: "'Noto Sans KR', sans-serif",
                }}
              />
            </div>

            {/* 선택한 달의 매출 미리보기 */}
            {requestPeriod && (() => {
              const preview = monthlyStats.find(s => s.month === requestPeriod);
              return preview ? (
                <div style={{
                  background: 'var(--bg-elevated)', borderRadius: 8,
                  padding: '14px 16px', marginBottom: 16, fontSize: 13,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>판매 건수</span>
                    <span style={{ fontWeight: 600 }}>{preview.sales_count}건</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>총 매출</span>
                    <span style={{ fontWeight: 600 }}>₩{preview.total_revenue.toLocaleString()}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 8, marginTop: 6 }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>예상 정산액</span>
                    <span style={{ fontWeight: 700, color: '#22c55e', fontSize: 15 }}>₩{preview.payout_amount.toLocaleString()}</span>
                  </div>
                </div>
              ) : (
                <div style={{
                  background: 'var(--bg-elevated)', borderRadius: 8,
                  padding: '12px 16px', marginBottom: 16,
                  fontSize: 13, color: 'var(--text-secondary)', textAlign: 'center',
                }}>
                  {requestPeriod} 매출 데이터가 없습니다.
                </div>
              );
            })()}

            <button
              className="btn-primary"
              style={{ width: '100%', padding: '12px', fontSize: 14 }}
              onClick={handleRequestSettlement}
              disabled={requesting || !requestPeriod}
            >
              {requesting ? '신청 중...' : '정산 신청하기'}
            </button>

            {requestMsg && (
              <p style={{
                marginTop: 12, fontSize: 13, color: '#22c55e',
                background: 'rgba(34,197,94,0.1)', borderRadius: 8,
                padding: '10px 14px', textAlign: 'center',
              }}>
                ✅ {requestMsg}
              </p>
            )}
            {requestError && (
              <p style={{
                marginTop: 12, fontSize: 13, color: 'var(--accent)',
                background: 'var(--accent-dim)', borderRadius: 8,
                padding: '10px 14px', textAlign: 'center',
              }}>
                ⚠️ {requestError}
              </p>
            )}

            <p style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 14, lineHeight: 1.6, textAlign: 'center' }}>
              신청 후 관리자 검토를 거쳐 정산됩니다.<br />
              정산 내역은 <Link href="/instructor/settlement" style={{ color: 'var(--accent)' }}>정산 내역 페이지</Link>에서 확인하세요.
            </p>
          </div>

          {/* 지난달 요약 */}
          {lastStat && (
            <div className="card" style={{ padding: '18px 20px', marginTop: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>
                📅 지난달 ({lm}) 요약
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                <span style={{ color: 'var(--text-secondary)' }}>매출</span>
                <span style={{ fontWeight: 700 }}>₩{lastStat.total_revenue.toLocaleString()}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                <span style={{ color: 'var(--text-secondary)' }}>정산액</span>
                <span style={{ fontWeight: 700, color: '#22c55e' }}>₩{lastStat.payout_amount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 내 강의 목록 ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700 }}>내 강의</h2>
          <Link href="/instructor/courses" style={{ fontSize: 13, color: 'var(--accent)', textDecoration: 'none' }}>
            전체 관리 →
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <p style={{ marginBottom: 16 }}>아직 등록한 강의가 없습니다.</p>
            <Link href="/instructor/courses/new">
              <button className="btn-primary" style={{ padding: '10px 24px' }}>첫 강의 만들기</button>
            </Link>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {courses.slice(0, 6).map(course => (
              <Link key={course.id} href={`/instructor/courses/${course.id}/lectures`} style={{ textDecoration: 'none' }}>
                <div className="card" style={{ padding: 20, cursor: 'pointer', height: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span className={`badge ${DIFFICULTY_CLASS[course.difficulty] || 'badge-beginner'}`}>
                      {DIFFICULTY_LABEL[course.difficulty] || course.difficulty}
                    </span>
                    {course.lecture_count !== undefined && (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>영상 {course.lecture_count}개</span>
                    )}
                    {course.price != null && (
                      <span style={{ fontSize: 12, color: course.price === 0 ? '#22c55e' : '#f59e0b', marginLeft: 'auto' }}>
                        {course.price === 0 ? '무료' : `₩${course.price.toLocaleString()}`}
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 6, color: '#ffffff' }}>{course.title}</h3>
                  <p style={{
                    fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5,
                    display: '-webkit-box', WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical', overflow: 'hidden',
                  }}>
                    {course.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
