'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { settlementApi } from '@/lib/api';
import { Settlement } from '@/types';

type StatsType = 'daily' | 'weekly' | 'monthly';

export default function AdminSettlementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [statsType, setStatsType] = useState<StatsType>('monthly');
  const [stats, setStats] = useState<{ stats: any[]; totalRevenue: number; totalPayments: number } | null>(null);
  const [generatePeriod, setGeneratePeriod] = useState('');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      settlementApi.getAdminSettlement().then(r => setSettlements(r.data ?? [])),
      settlementApi.getAdminStats(statsType).then(r => setStats(r.data ?? null)),
    ]).finally(() => setLoading(false));
  }, [statsType]);

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard');
  }, [user, router]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleGenerate = async () => {
    if (!generatePeriod) return;
    setGenerating(true);
    try {
      const res = await settlementApi.generateSettlement(generatePeriod);
      alert(res.message);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const maxRevenue = Math.max(...(stats?.stats.map(s => s.total_revenue) ?? [1]), 1);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>정산 관리</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>전체 매출 및 강사 정산 현황</p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: '총 결제 건수', value: `${stats?.totalPayments ?? 0}건` },
          { label: '총 매출', value: `₩${(stats?.totalRevenue ?? 0).toLocaleString()}` },
          { label: '총 정산 예정액', value: `₩${Math.round((stats?.totalRevenue ?? 0) * 0.7).toLocaleString()}` },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* 기간별 매출 차트 */}
      {stats && stats.stats.length > 0 && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <h3 style={{ fontWeight: 700 }}>기간별 매출</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['daily', 'weekly', 'monthly'] as StatsType[]).map(t => (
                <button key={t} onClick={() => setStatsType(t)} style={{
                  padding: '4px 12px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                  background: statsType === t ? 'var(--primary)' : 'var(--border)',
                  color: statsType === t ? '#fff' : 'var(--text)',
                }}>{t === 'daily' ? '일별' : t === 'weekly' ? '주별' : '월별'}</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 120 }}>
            {stats.stats.slice(0, 12).reverse().map(s => (
              <div key={s.period} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{
                  width: '100%', background: 'var(--primary)',
                  height: `${Math.max(4, (s.total_revenue / maxRevenue) * 100)}px`,
                  borderRadius: '4px 4px 0 0', opacity: 0.85,
                }} />
                <div style={{ fontSize: 10, color: 'var(--text-secondary)', textAlign: 'center' }}>{s.period.slice(-5)}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 정산 생성 */}
      <div className="card" style={{ padding: 20, marginBottom: 24, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6 }}>정산 기간 (YYYY-MM)</div>
          <input className="input" placeholder="2026-06" value={generatePeriod} onChange={e => setGeneratePeriod(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={handleGenerate} disabled={generating || !generatePeriod}>
          {generating ? '생성 중...' : '정산 생성'}
        </button>
        <a href={settlementApi.exportCSV()} download style={{ textDecoration: 'none' }}>
          <button className="btn-secondary">CSV 다운로드</button>
        </a>
      </div>

      {/* 정산 목록 */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['기간', '강사', '강의명', '매출', '정산액', '상태'].map(h => (
                <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {settlements.map(s => (
              <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '10px 16px', fontWeight: 600 }}>{s.period}</td>
                <td style={{ padding: '10px 16px' }}>{s.instructor_name}</td>
                <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{s.course_title}</td>
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
