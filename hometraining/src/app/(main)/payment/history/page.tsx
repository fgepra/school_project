// src/app/(main)/payment/history/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { paymentApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Payment } from '@/types';

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  completed: { text: '결제 완료', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
  refunded:  { text: '환불 완료', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  pending:   { text: '처리 중',   color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
};

export default function PaymentHistoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    paymentApi.getMyPayments()
      .then(res => setPayments(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleRefund = async (paymentId: number) => {
    if (!window.confirm('환불을 신청하시겠습니까? 환불 후 강의 접근이 불가합니다.')) return;
    setRefunding(paymentId);
    try {
      await paymentApi.refund(paymentId);
      setPayments(prev => prev.map(p => p.id === paymentId ? { ...p, status: 'refunded' as const } : p));
    } catch (e) {
      alert(e instanceof Error ? e.message : '환불 처리에 실패했습니다.');
    } finally {
      setRefunding(null);
    }
  };

  const totalPaid = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const totalRefunded = payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;
  if (!user) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>로그인이 필요합니다.</div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>결제 내역</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>내 강의 구매 및 환불 내역입니다.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: '총 결제 건수', value: `${payments.length}건`, icon: '📋' },
          { label: '총 결제 금액', value: `₩${totalPaid.toLocaleString()}`, icon: '💳' },
          { label: '총 환불 금액', value: `₩${totalRefunded.toLocaleString()}`, icon: '↩️' },
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

      {payments.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>결제 내역이 없습니다</p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 24 }}>유료 강의를 구매하면 여기에 표시됩니다.</p>
          <button onClick={() => router.push('/courses')} style={{ padding: '10px 24px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
            강의 둘러보기
          </button>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['강의명', '금액', '결제 수단', '상태', '결제일', ''].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map(p => {
                  const st = STATUS_LABEL[p.status] ?? STATUS_LABEL.pending;
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 600, maxWidth: 200 }}>
                        <button onClick={() => router.push(`/courses/${p.course_id}`)} style={{ background: 'none', border: 'none', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: "'Noto Sans KR', sans-serif", textAlign: 'left', padding: 0 }}>
                          {p.course_title}
                        </button>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>₩{p.amount.toLocaleString()}</td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>{p.card_last4 ? `카드 *${p.card_last4}` : p.payment_method}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: st.color, background: st.bg, padding: '3px 10px', borderRadius: 20 }}>{st.text}</span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{new Date(p.created_at).toLocaleDateString('ko-KR')}</td>
                      <td style={{ padding: '14px 16px' }}>
                        {p.status === 'completed' && (
                          <button onClick={() => handleRefund(p.id)} disabled={refunding === p.id} style={{ padding: '5px 12px', borderRadius: 6, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 12, cursor: refunding === p.id ? 'not-allowed' : 'pointer', fontFamily: "'Noto Sans KR', sans-serif", opacity: refunding === p.id ? 0.5 : 1 }}>
                            {refunding === p.id ? '처리 중...' : '환불'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
