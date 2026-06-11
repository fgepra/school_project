'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { settlementApi } from '@/lib/api';
import { Settlement } from '@/types';

export default function InstructorSettlementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<{ month: string; sales_count: number; total_revenue: number; payout_amount: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      settlementApi.getInstructorSettlement().then(r => setSettlements(r.data ?? [])),
      settlementApi.getInstructorMonthlyStats().then(r => setMonthlyStats(r.data ?? [])),
    ]).finally(() => setLoading(false));
  }, [user]);

  useEffect(() => {
    if (user && user.role === 'student') router.push('/dashboard');
  }, [user, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalRevenue = monthlyStats.reduce((s, m) => s + m.total_revenue, 0);
  const totalPayout = monthlyStats.reduce((s, m) => s + m.payout_amount, 0);
  const pendingCount = settlements.filter(s => s.status === 'pending').length;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>정산 내역</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>강의 매출 및 정산 현황</p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: '총 매출', value: `₩${totalRevenue.toLocaleString()}` },
          { label: '총 정산액 (70%)', value: `₩${totalPayout.toLocaleString()}`, color: 'var(--green)' },
          { label: '정산 대기 건수', value: `${pendingCount}건` },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color || 'var(--text)' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 월별 통계 */}
      {monthlyStats.length > 0 && (
        <div className="card" style={{ marginBottom: 24, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>월별 매출</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['월', '결제 건수', '매출', '정산액'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthlyStats.map(m => (
                <tr key={m.month} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{m.month}</td>
                  <td style={{ padding: '10px 16px' }}>{m.sales_count}건</td>
                  <td style={{ padding: '10px 16px' }}>₩{m.total_revenue.toLocaleString()}</td>
                  <td style={{ padding: '10px 16px', color: 'var(--green)', fontWeight: 600 }}>₩{m.payout_amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 정산 상세 목록 */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>정산 상세</div>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['기간', '강의명', '매출', '정산액', '상태'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {settlements.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 16px', fontWeight: 600 }}>{s.period}</td>
                <td style={{ padding: '10px 16px' }}>{s.course_title}</td>
                <td style={{ padding: '10px 16px' }}>₩{s.revenue.toLocaleString()}</td>
                <td style={{ padding: '10px 16px', color: 'var(--green)', fontWeight: 600 }}>₩{s.payout_amount.toLocaleString()}</td>
                <td style={{ padding: '10px 16px' }}>
                  <span style={{ color: s.status === 'paid' ? 'var(--green)' : 'var(--text-secondary)', fontWeight: 600 }}>
                    {s.status === 'paid' ? '완료' : '대기'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {settlements.length === 0 && (
          <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>정산 내역이 없습니다.</div>
        )}
      </div>
    </div>
  );
}
