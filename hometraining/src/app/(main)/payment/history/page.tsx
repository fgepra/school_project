'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { paymentApi } from '@/lib/api';
import { Payment } from '@/types';

const STATUS_LABEL: Record<string, string> = { completed: '완료', refunded: '환불', pending: '대기' };
const STATUS_COLOR: Record<string, string> = { completed: 'var(--green)', refunded: 'var(--red)', pending: 'var(--text-secondary)' };

export default function PaymentHistoryPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refunding, setRefunding] = useState<number | null>(null);

  const fetchPayments = useCallback(() => {
    if (!user) return;
    paymentApi.getMyPayments()
      .then(res => setPayments(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleRefund = async (paymentId: number) => {
    if (!confirm('환불을 신청하시겠습니까?')) return;
    setRefunding(paymentId);
    try {
      await paymentApi.refund(paymentId);
      fetchPayments();
    } catch (err: any) {
      alert(err.message || '환불 처리 중 오류가 발생했습니다.');
    } finally {
      setRefunding(null);
    }
  };

  const totalCompleted = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);
  const totalRefunded = payments.filter(p => p.status === 'refunded').reduce((s, p) => s + p.amount, 0);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>결제 내역</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>나의 강의 결제 이력입니다.</p>
      </div>

      {/* 통계 카드 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 32 }}>
        {[
          { label: '총 결제 건수', value: `${payments.length}건` },
          { label: '총 결제 금액', value: `₩${totalCompleted.toLocaleString()}` },
          { label: '총 환불 금액', value: `₩${totalRefunded.toLocaleString()}`, color: 'var(--red)' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{stat.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: stat.color || 'var(--text)' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {payments.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
          결제 내역이 없습니다.
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['강의명', '금액', '결제 수단', '결제일', '상태', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{p.course_title}</td>
                  <td style={{ padding: '12px 16px' }}>₩{p.amount.toLocaleString()}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {p.payment_method} (*{p.card_last4})
                  </td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                    {new Date(p.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ color: STATUS_COLOR[p.status], fontWeight: 600 }}>
                      {STATUS_LABEL[p.status]}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {p.status === 'completed' && (
                      <button
                        onClick={() => handleRefund(p.id)}
                        disabled={refunding === p.id}
                        style={{
                          padding: '4px 12px', borderRadius: 6, border: '1px solid var(--border)',
                          background: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12,
                          opacity: refunding === p.id ? 0.5 : 1,
                        }}
                      >
                        {refunding === p.id ? '처리 중...' : '환불'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
