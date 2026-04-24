// src/app/(main)/admin/settlement/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { settlementApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Settlement } from '@/types';

type PeriodType = 'daily' | 'weekly' | 'monthly';

interface RevenueStat {
  period: string;
  payment_count: number;
  total_revenue: number;
  unique_buyers: number;
}

export default function AdminSettlementPage() {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [stats, setStats] = useState<RevenueStat[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalPayments, setTotalPayments] = useState(0);
  const [periodType, setPeriodType] = useState<PeriodType>('monthly');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [generatePeriod, setGeneratePeriod] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    setLoading(true);
    Promise.all([
      settlementApi.getAdminSettlement(),
      settlementApi.getAdminStats(periodType),
    ]).then(([sRes, stRes]) => {
      setSettlements(sRes.data ?? []);
      setStats(stRes.data?.stats ?? []);
      setTotalRevenue(stRes.data?.totalRevenue ?? 0);
      setTotalPayments(stRes.data?.totalPayments ?? 0);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user, periodType]);

  const handleGenerate = async () => {
    if (!window.confirm(`${generatePeriod} 정산을 생성하시겠습니까?`)) return;
    setGenerating(true);
    try {
      await settlementApi.generateSettlement(generatePeriod);
      alert('정산이 생성되었습니다.');
      const res = await settlementApi.getAdminSettlement();
      setSettlements(res.data ?? []);
    } catch (e) {
      alert(e instanceof Error ? e.message : '정산 생성에 실패했습니다.');
    } finally {
      setGenerating(false);
    }
  };

  if (!user || user.role !== 'admin') return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>접근 권한이 없습니다.</div>;
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  const maxRevenue = Math.max(...stats.map(s => s.total_revenue), 1);

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>매출 / 정산 관리</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>전체 결제 매출 및 강사 정산 내역을 관리합니다.</p>
        </div>
        <a href={settlementApi.exportCSV()} download style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          📥 CSV 내보내기
        </a>
      </div>

      {/* 요약 통계 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: '총 매출', value: `₩${totalRevenue.toLocaleString()}`, icon: '💰' },
          { label: '총 결제 건수', value: `${totalPayments}건`, icon: '📊' },
          { label: '정산 내역 수', value: `${settlements.length}건`, icon: '📋' },
        ].map(item => (
          <div key={item.label} className="card" style={{ padding: '18px 20px', display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ fontSize: 26 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{item.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700 }}>{item.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 매출 차트 */}
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>기간별 매출</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {(['daily', 'weekly', 'monthly'] as PeriodType[]).map(t => (
              <button key={t} onClick={() => setPeriodType(t)} style={{ padding: '6px 12px', borderRadius: 6, border: `1px solid ${periodType === t ? 'var(--accent)' : 'var(--border)'}`, background: periodType === t ? 'var(--accent-dim)' : 'transparent', color: periodType === t ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 12, fontWeight: periodType === t ? 700 : 400, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
                {t === 'daily' ? '일별' : t === 'weekly' ? '주별' : '월별'}
              </button>
            ))}
          </div>
        </div>
        {stats.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14, padding: '20px 0' }}>매출 데이터가 없습니다.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {stats.slice(-10).map(s => (
              <div key={s.period}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{s.period}</span>
                  <span style={{ fontWeight: 700 }}>₩{s.total_revenue.toLocaleString()} ({s.payment_count}건)</span>
                </div>
                <div style={{ height: 8, borderRadius: 4, background: 'var(--bg-elevated)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 4, background: 'var(--accent)', width: `${(s.total_revenue / maxRevenue) * 100}%`, transition: 'width 0.4s' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 정산 생성 */}
      <div className="card" style={{ padding: 20, marginBottom: 20 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 14 }}>수동 정산 생성</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            className="input-field"
            type="month"
            value={generatePeriod}
            onChange={e => setGeneratePeriod(e.target.value)}
            style={{ width: 180 }}
          />
          <button onClick={handleGenerate} disabled={generating} style={{ padding: '9px 20px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.6 : 1, fontFamily: "'Noto Sans KR', sans-serif" }}>
            {generating ? '생성 중...' : '정산 생성'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>선택한 월의 결제 내역을 집계하여 강사별 정산을 생성합니다.</p>
      </div>

      {/* 정산 내역 테이블 */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 15, fontWeight: 700 }}>정산 내역</h2>
        </div>
        {settlements.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)', fontSize: 14 }}>정산 내역이 없습니다. 정산을 생성해 주세요.</div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['기간', '강사', '강의', '매출', '정산액 (70%)', '상태'].map(h => (
                    <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {settlements.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.period}</td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{s.instructor_name}</td>
                    <td style={{ padding: '12px 16px', maxWidth: 180 }}>{s.course_title}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>₩{s.revenue.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px', color: '#22c55e', fontWeight: 700 }}>₩{s.payout_amount.toLocaleString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: s.status === 'paid' ? '#22c55e' : '#f59e0b', background: s.status === 'paid' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', padding: '3px 10px', borderRadius: 20 }}>
                        {s.status === 'paid' ? '정산 완료' : '정산 대기'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
