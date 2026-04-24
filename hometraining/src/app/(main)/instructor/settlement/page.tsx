// src/app/(main)/instructor/settlement/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { settlementApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Settlement } from '@/types';

export default function InstructorSettlementPage() {
  const { user } = useAuth();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    settlementApi.getInstructorSettlement()
      .then(res => setSettlements(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const totalRevenue = settlements.reduce((s, item) => s + item.revenue, 0);
  const totalPayout  = settlements.reduce((s, item) => s + item.payout_amount, 0);
  const pendingCount = settlements.filter(s => s.status === 'pending').length;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;
  if (!user) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>로그인이 필요합니다.</div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>수익 정산</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
          내 강의 판매 수익 및 정산 내역입니다. 수익의 70%가 정산됩니다.
        </p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: '총 매출', value: `₩${totalRevenue.toLocaleString()}`, icon: '💰', sub: '강의 판매 합계' },
          { label: '총 정산액 (70%)', value: `₩${totalPayout.toLocaleString()}`, icon: '💵', sub: '실 수령 금액' },
          { label: '정산 대기', value: `${pendingCount}건`, icon: '⏳', sub: '처리 중인 정산' },
        ].map(item => (
          <div key={item.label} className="card" style={{ padding: '20px 22px' }}>
            <div style={{ fontSize: 24, marginBottom: 10 }}>{item.icon}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{item.label}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{item.value}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{item.sub}</div>
          </div>
        ))}
      </div>

      {/* 정산 내역 */}
      {settlements.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>정산 내역이 없습니다</p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>강의가 판매되면 매월 초 정산이 자동으로 생성됩니다.</p>
        </div>
      ) : (
        <>
          {/* 월별 그룹핑 */}
          {Object.entries(
            settlements.reduce<Record<string, Settlement[]>>((acc, s) => {
              (acc[s.period] ??= []).push(s);
              return acc;
            }, {})
          ).sort(([a], [b]) => b.localeCompare(a)).map(([period, items]) => (
            <div key={period} style={{ marginBottom: 16 }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)' }}>{period}</h3>
              <div className="card" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['강의명', '매출', '정산액 (70%)', '상태'].map(h => (
                        <th key={h} style={{ padding: '11px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(s => (
                      <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>{s.course_title}</td>
                        <td style={{ padding: '12px 16px', fontWeight: 700 }}>₩{s.revenue.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px', color: '#22c55e', fontWeight: 700 }}>₩{s.payout_amount.toLocaleString()}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{ fontSize: 12, fontWeight: 600, color: s.status === 'paid' ? '#22c55e' : '#f59e0b', background: s.status === 'paid' ? 'rgba(34,197,94,0.12)' : 'rgba(245,158,11,0.12)', padding: '3px 10px', borderRadius: 20 }}>
                            {s.status === 'paid' ? '✅ 정산 완료' : '⏳ 정산 대기'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr style={{ background: 'var(--bg-elevated)' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: 'var(--text-secondary)', fontSize: 13 }}>소계</td>
                      <td style={{ padding: '10px 16px', fontWeight: 700 }}>₩{items.reduce((s, i) => s + i.revenue, 0).toLocaleString()}</td>
                      <td style={{ padding: '10px 16px', fontWeight: 700, color: '#22c55e' }}>₩{items.reduce((s, i) => s + i.payout_amount, 0).toLocaleString()}</td>
                      <td />
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
