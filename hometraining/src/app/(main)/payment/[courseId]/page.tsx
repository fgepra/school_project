'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { courseApi, paymentApi } from '@/lib/api';
import { Course } from '@/types';

const CARDS = [
  { name: '신한카드', color: '#1957AE' },
  { name: '국민카드', color: '#FFB900' },
  { name: '현대카드', color: '#333333' },
  { name: '삼성카드', color: '#1428A0' },
  { name: '롯데카드', color: '#E60012' },
  { name: '하나카드', color: '#008C7C' },
];

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.courseId);

  const [course, setCourse] = useState<Course | null>(null);
  const [step, setStep] = useState(1);
  const [selectedCard, setSelectedCard] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [installment, setInstallment] = useState('일시불');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    courseApi.getById(courseId).then(setCourse).catch(() => router.push('/courses'));
  }, [courseId, router]);

  const formatCardNumber = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1-').replace(/-$/, '');

  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? digits.slice(0, 2) + '/' + digits.slice(2) : digits;
  };

  const cardLast4 = cardNumber.replace(/\D/g, '').slice(-4);

  const handlePay = async () => {
    if (!selectedCard || cardNumber.replace(/\D/g, '').length < 16 || expiry.length < 5 || cvc.length < 3) {
      setError('카드 정보를 모두 입력해주세요.');
      return;
    }
    setStep(3);
    setLoading(true);
    try {
      await new Promise(r => setTimeout(r, 1500));
      await paymentApi.process({
        courseId,
        amount: course?.price ?? 0,
        paymentMethod: selectedCard,
        cardLast4,
      });
      sessionStorage.setItem('lastPayment', JSON.stringify({
        courseTitle: course?.title,
        amount: course?.price,
        paymentMethod: selectedCard,
        cardLast4,
      }));
      router.push('/payment/complete');
    } catch (err: any) {
      setError(err.message || '결제에 실패했습니다.');
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  if (!course) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  return (
    <div className="fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '40px 16px' }}>
      {/* 진행 단계 */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
        {['카드 정보', '결제 확인', '처리 중'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: step > i + 1 ? 'var(--green)' : step === i + 1 ? 'var(--primary)' : 'var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 700, color: step >= i + 1 ? '#fff' : 'var(--text-secondary)',
            }}>{i + 1}</div>
            <span style={{ fontSize: 12, color: step === i + 1 ? 'var(--text)' : 'var(--text-secondary)' }}>{label}</span>
            {i < 2 && <span style={{ color: 'var(--border)' }}>›</span>}
          </div>
        ))}
      </div>

      {/* 강의 정보 요약 */}
      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>결제할 강의</div>
        <div style={{ fontWeight: 700 }}>{course.title}</div>
        <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--primary)', marginTop: 8 }}>
          {(course as any).price > 0 ? `₩${Number((course as any).price).toLocaleString()}` : '무료'}
        </div>
      </div>

      {/* Step 1 — 카드 정보 입력 */}
      {step === 1 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20 }}>카드 정보 입력</h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
            {CARDS.map(card => (
              <button
                key={card.name}
                onClick={() => setSelectedCard(card.name)}
                style={{
                  padding: '10px 4px', borderRadius: 8, border: '2px solid',
                  borderColor: selectedCard === card.name ? card.color : 'var(--border)',
                  background: selectedCard === card.name ? card.color + '22' : 'transparent',
                  color: 'var(--text)', cursor: 'pointer', fontSize: 12, fontWeight: 600,
                }}
              >{card.name}</button>
            ))}
          </div>

          <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-secondary)' }}>카드 번호</label>
          <input
            className="input" style={{ width: '100%', marginBottom: 16 }}
            placeholder="0000-0000-0000-0000"
            value={cardNumber}
            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-secondary)' }}>유효기간</label>
              <input className="input" style={{ width: '100%' }} placeholder="MM/YY" value={expiry}
                onChange={e => setExpiry(formatExpiry(e.target.value))} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-secondary)' }}>CVC</label>
              <input className="input" style={{ width: '100%' }} placeholder="000" maxLength={3} value={cvc}
                onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))} />
            </div>
          </div>

          <label style={{ display: 'block', marginBottom: 4, fontSize: 13, color: 'var(--text-secondary)' }}>할부</label>
          <select className="input" style={{ width: '100%', marginBottom: 20 }}
            value={installment} onChange={e => setInstallment(e.target.value)}>
            <option>일시불</option>
            {[2,3,6,12].map(n => <option key={n}>{n}개월</option>)}
          </select>

          {error && <p style={{ color: 'var(--red)', fontSize: 13, marginBottom: 12 }}>{error}</p>}
          <button className="btn-primary" style={{ width: '100%' }} onClick={() => { setError(''); setStep(2); }}>
            다음
          </button>
        </div>
      )}

      {/* Step 2 — 결제 확인 */}
      {step === 2 && (
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ marginBottom: 20 }}>결제 확인</h3>
          {[
            ['강의명', course.title],
            ['결제 금액', `₩${Number((course as any).price).toLocaleString()}`],
            ['카드사', selectedCard],
            ['카드 번호', `**** **** **** ${cardLast4}`],
            ['할부', installment],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          ))}
          {error && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{error}</p>}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
            <button className="btn-secondary" onClick={() => setStep(1)}>이전</button>
            <button className="btn-primary" onClick={handlePay}>결제하기</button>
          </div>
        </div>
      )}

      {/* Step 3 — 처리 중 */}
      {step === 3 && (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 20px' }} />
          <p style={{ color: 'var(--text-secondary)' }}>결제 처리 중...</p>
        </div>
      )}
    </div>
  );
}
