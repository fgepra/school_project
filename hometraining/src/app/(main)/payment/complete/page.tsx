'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function PaymentCompletePage() {
  const [info, setInfo] = useState<{
    courseTitle?: string;
    amount?: number;
    paymentMethod?: string;
    cardLast4?: string;
  }>({});

  useEffect(() => {
    const raw = sessionStorage.getItem('lastPayment');
    if (raw) setInfo(JSON.parse(raw));
  }, []);

  const refundDeadline = new Date();
  refundDeadline.setDate(refundDeadline.getDate() + 7);

  return (
    <div className="fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '60px 16px', textAlign: 'center' }}>
      <div style={{
        width: 72, height: 72, borderRadius: '50%', background: 'var(--green)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 36, margin: '0 auto 24px',
      }}>✓</div>

      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 8 }}>결제 완료!</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>강의 수강을 시작할 수 있습니다.</p>

      <div className="card" style={{ padding: 24, textAlign: 'left', marginBottom: 24 }}>
        {[
          ['강의명', info.courseTitle || '-'],
          ['결제 금액', info.amount != null ? `₩${Number(info.amount).toLocaleString()}` : '-'],
          ['결제 수단', info.paymentMethod ? `${info.paymentMethod} (**** ${info.cardLast4})` : '-'],
          ['환불 가능 기한', refundDeadline.toLocaleDateString('ko-KR')],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
            <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
            <span style={{ fontWeight: 600 }}>{v}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Link href="/courses" style={{ textDecoration: 'none' }}>
          <button className="btn-secondary" style={{ width: '100%' }}>강의 목록</button>
        </Link>
        <Link href="/payment/history" style={{ textDecoration: 'none' }}>
          <button className="btn-primary" style={{ width: '100%' }}>결제 내역 보기</button>
        </Link>
      </div>
    </div>
  );
}
