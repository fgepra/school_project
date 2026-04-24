// src/app/(main)/payment/complete/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function CompleteContent() {
  const params = useSearchParams();
  const router = useRouter();

  const courseId = params.get('courseId');
  const amount   = params.get('amount');
  const title    = params.get('title') ? decodeURIComponent(params.get('title')!) : '강의';

  return (
    <div className="fade-in" style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 72, marginBottom: 16 }}>🎉</div>
      <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 10 }}>결제 완료!</h1>
      <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.7 }}>
        <strong style={{ color: 'var(--text-primary)' }}>{title}</strong> 강의를<br />
        성공적으로 구매했습니다.
      </p>

      <div className="card" style={{ padding: '20px 24px', marginBottom: 28, textAlign: 'left' }}>
        <h3 style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 14 }}>결제 내역</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {([
            ['강의명', title],
            ['결제 금액', amount ? `₩${Number(amount).toLocaleString()}` : '무료'],
            ['결제 상태', '✅ 완료'],
            ['환불 기한', (() => { const d = new Date(); d.setDate(d.getDate() + 7); return d.toLocaleDateString('ko-KR'); })()],
          ] as [string, string][]).map(([label, value]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
              <span style={{ fontWeight: 600 }}>{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => router.push('/payment/history')}
          style={{ flex: 1, padding: '13px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          결제 내역 보기
        </button>
        <button
          onClick={() => router.push(courseId ? `/courses/${courseId}` : '/courses')}
          style={{ flex: 2, padding: '13px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          강의 바로 시작하기 →
        </button>
      </div>
    </div>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>}>
      <CompleteContent />
    </Suspense>
  );
}
