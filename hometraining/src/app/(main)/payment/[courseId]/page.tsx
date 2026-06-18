'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Script from 'next/script';
import { courseApi, paymentApi } from '@/lib/api';
import { Course } from '@/types';

const TOSS_CLIENT_KEY = 'test_ck_docs_Ovk5rk1EwkEbP0W43n07xlzm';

const CARDS = [
  { name: '신한카드', color: '#1957AE' },
  { name: '국민카드', color: '#FFB900' },
  { name: '현대카드', color: '#333333' },
  { name: '삼성카드', color: '#1428A0' },
  { name: '롯데카드', color: '#E60012' },
  { name: '하나카드', color: '#008C7C' },
];

type PaymentType = 'card' | 'toss';

export default function PaymentPage() {
  const router = useRouter();
  const params = useParams();
  const courseId = Number(params.courseId);

  const [course, setCourse] = useState<Course | null>(null);
  const [paymentType, setPaymentType] = useState<PaymentType>('card');
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

  // 카드 직접 결제
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

  // 토스페이 결제
  const handleTossPay = async () => {
    setError('');
    const TossPayments = (window as any).TossPayments;
    if (typeof TossPayments !== 'function') {
      setError('토스 결제 모듈을 불러오는 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    const tossPayments = TossPayments(TOSS_CLIENT_KEY);
    const orderId = `order_${courseId}_${Date.now()}`;
    try {
      await tossPayments.requestPayment('카드', {
        amount: course?.price ?? 0,
        orderId,
        orderName: course?.title ?? '',
        customerName: '홈핏 고객',
        successUrl: `${window.location.origin}/payment/toss/success?courseId=${courseId}`,
        failUrl: `${window.location.origin}/payment/toss/fail?courseId=${courseId}`,
      });
    } catch (err: any) {
      if (err?.code === 'USER_CANCEL') {
        setError('결제가 취소되었습니다.');
      } else {
        setError(err?.message || '결제 요청에 실패했습니다.');
      }
    }
  };

  const price = (course as any)?.price ?? 0;

  if (!course) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  return (
    <>
      <Script src="https://js.tosspayments.com/v1/payment" strategy="afterInteractive" />
      <div className="fade-in" style={{ maxWidth: 480, margin: '0 auto', padding: '40px 16px' }}>

        {/* 진행 단계 */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 32, justifyContent: 'center' }}>
          {['결제 수단', '결제 확인', '처리 중'].map((label, i) => (
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
            {price > 0 ? `₩${Number(price).toLocaleString()}` : '무료'}
          </div>
        </div>

        {/* Step 1 — 결제 수단 선택 */}
        {step === 1 && (
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ marginBottom: 20 }}>결제 수단 선택</h3>

            {/* 결제 유형 탭 */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              {([
                { type: 'card' as PaymentType, label: '💳 카드 직접 입력' },
                { type: 'toss' as PaymentType, label: '🔵 토스페이' },
              ]).map(({ type, label }) => (
                <button
                  key={type}
                  onClick={() => { setPaymentType(type); setError(''); }}
                  style={{
                    flex: 1, padding: '12px 8px', borderRadius: 10, cursor: 'pointer',
                    border: `2px solid ${paymentType === type ? 'var(--primary)' : 'var(--border)'}`,
                    background: paymentType === type ? 'rgba(99,102,241,0.1)' : 'transparent',
                    color: paymentType === type ? 'var(--primary)' : 'var(--text-secondary)',
                    fontFamily: "'Noto Sans KR', sans-serif",
                    fontWeight: 700, fontSize: 13, transition: 'all 0.15s',
                  }}
                >{label}</button>
              ))}
            </div>

            {/* 카드 직접 입력 폼 */}
            {paymentType === 'card' && (
              <>
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
              </>
            )}

            {/* 토스페이 안내 */}
            {paymentType === 'toss' && (
              <div style={{
                background: 'rgba(0,91,255,0.06)', border: '1px solid rgba(0,91,255,0.2)',
                borderRadius: 12, padding: '20px', marginBottom: 20, textAlign: 'center',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔵</div>
                <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>토스페이로 간편 결제</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  다음 단계에서 토스 결제창이 열립니다.<br />
                  카드, 계좌이체, 토스머니 등으로 결제하실 수 있습니다.
                </div>
              </div>
            )}

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
              ['결제 금액', `₩${Number(price).toLocaleString()}`],
              ['결제 수단', paymentType === 'toss' ? '토스페이' : selectedCard],
              ...(paymentType === 'card' ? [
                ['카드 번호', `**** **** **** ${cardLast4}`],
                ['할부', installment],
              ] : []),
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: 14 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            {error && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{error}</p>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
              <button className="btn-secondary" onClick={() => setStep(1)}>이전</button>
              <button className="btn-primary" onClick={paymentType === 'toss' ? handleTossPay : handlePay}>
                {paymentType === 'toss' ? '토스페이로 결제' : '결제하기'}
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — 처리 중 (카드 결제 전용) */}
        {step === 3 && (
          <div className="card" style={{ padding: 60, textAlign: 'center' }}>
            <div className="spinner" style={{ margin: '0 auto 20px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>결제 처리 중...</p>
          </div>
        )}
      </div>
    </>
  );
}
