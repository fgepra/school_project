'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { paymentApi } from '@/lib/api';

export default function TossSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const paymentKey = searchParams.get('paymentKey');
    const orderId = searchParams.get('orderId');
    const amount = searchParams.get('amount');
    const courseId = searchParams.get('courseId');

    if (!paymentKey || !orderId || !amount || !courseId) {
      setErrorMsg('결제 정보가 올바르지 않습니다.');
      setStatus('error');
      return;
    }

    paymentApi.confirmToss({ paymentKey, orderId, amount: Number(amount), courseId: Number(courseId) })
      .then(() => {
        sessionStorage.setItem('lastPayment', JSON.stringify({
          courseTitle: '',
          amount: Number(amount),
          paymentMethod: '토스페이',
          cardLast4: null,
        }));
        setStatus('success');
        setTimeout(() => router.push('/payment/complete'), 1000);
      })
      .catch((err: any) => {
        setErrorMsg(err.message || '결제 확인에 실패했습니다.');
        setStatus('error');
      });
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      {status === 'loading' && (
        <>
          <div className="spinner" />
          <p style={{ color: 'var(--text-secondary)' }}>결제 확인 중...</p>
        </>
      )}
      {status === 'success' && (
        <>
          <div style={{ fontSize: 48 }}>✅</div>
          <p style={{ fontWeight: 700, fontSize: 18 }}>결제 완료! 페이지를 이동합니다...</p>
        </>
      )}
      {status === 'error' && (
        <>
          <div style={{ fontSize: 48 }}>❌</div>
          <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--red)' }}>결제 실패</p>
          <p style={{ color: 'var(--text-secondary)' }}>{errorMsg}</p>
          <button className="btn-primary" onClick={() => router.back()}>돌아가기</button>
        </>
      )}
    </div>
  );
}
