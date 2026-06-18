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

type PaymentType = 'card' | 'toss';

// 토스페이 모의 결제 모달
function TossModal({
  amount,
  orderName,
  onSuccess,
  onCancel,
}: {
  amount: number;
  orderName: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [phase, setPhase] = useState<'input' | 'processing' | 'done'>('input');
  const [phone, setPhone] = useState('');

  const formatPhone = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 11);
    if (d.length <= 3) return d;
    if (d.length <= 7) return d.slice(0, 3) + '-' + d.slice(3);
    return d.slice(0, 3) + '-' + d.slice(3, 7) + '-' + d.slice(7);
  };

  const handlePay = async () => {
    setPhase('processing');
    await new Promise(r => setTimeout(r, 1800));
    setPhase('done');
    await new Promise(r => setTimeout(r, 800));
    onSuccess();
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff', borderRadius: 20, width: 360, overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        fontFamily: "'Noto Sans KR', sans-serif",
      }}>
        {/* 헤더 */}
        <div style={{
          background: '#0064FF', padding: '20px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <circle cx="14" cy="14" r="14" fill="white" fillOpacity="0.2"/>
              <text x="14" y="19" textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">T</text>
            </svg>
            <span style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>토스페이</span>
          </div>
          {phase === 'input' && (
            <button onClick={onCancel} style={{
              background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)',
              fontSize: 20, cursor: 'pointer', padding: 0, lineHeight: 1,
            }}>✕</button>
          )}
        </div>

        {/* 바디 */}
        <div style={{ padding: '24px 24px 28px', color: '#111' }}>
          {phase === 'input' && (
            <>
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, color: '#666', marginBottom: 4 }}>{orderName}</div>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#0064FF' }}>
                  ₩{Number(amount).toLocaleString()}
                </div>
              </div>

              <div style={{ background: '#f5f6f8', borderRadius: 12, padding: '14px 16px', marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: '#888', marginBottom: 6 }}>토스 계정 전화번호</div>
                <input
                  type="tel"
                  placeholder="010-0000-0000"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  style={{
                    width: '100%', border: 'none', background: 'transparent',
                    fontSize: 16, fontWeight: 600, color: '#111', outline: 'none',
                    fontFamily: "'Noto Sans KR', sans-serif",
                  }}
                />
              </div>
              <div style={{ fontSize: 11, color: '#aaa', marginBottom: 20 }}>
                * 토스 앱에서 결제 승인 후 완료됩니다
              </div>

              <button
                onClick={handlePay}
                style={{
                  width: '100%', padding: '15px', borderRadius: 12, border: 'none',
                  background: '#0064FF', color: '#fff', fontSize: 16, fontWeight: 700,
                  cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif",
                }}
              >
                결제하기
              </button>
            </>
          )}

          {phase === 'processing' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 48, height: 48, border: '4px solid #e0eaff',
                borderTop: '4px solid #0064FF', borderRadius: '50%',
                margin: '0 auto 16px',
                animation: 'spin 0.8s linear infinite',
              }} />
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>결제 처리 중...</div>
              <div style={{ fontSize: 13, color: '#888' }}>토스 앱에서 승인 확인 중입니다</div>
            </div>
          )}

          {phase === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: 56, height: 56, borderRadius: '50%', background: '#e8f3ff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: 28,
              }}>✅</div>
              <div style={{ fontWeight: 700, fontSize: 16 }}>결제 완료!</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [showTossModal, setShowTossModal] = useState(false);

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

  // 토스페이 모의 결제 완료 처리
  const handleTossSuccess = async () => {
    setShowTossModal(false);
    setStep(3);
    try {
      await paymentApi.process({
        courseId,
        amount: course?.price ?? 0,
        paymentMethod: '토스페이',
        cardLast4: null,
      });
      sessionStorage.setItem('lastPayment', JSON.stringify({
        courseTitle: course?.title,
        amount: course?.price,
        paymentMethod: '토스페이',
        cardLast4: null,
      }));
      router.push('/payment/complete');
    } catch (err: any) {
      setError(err.message || '결제 처리 중 오류가 발생했습니다.');
      setStep(2);
    }
  };

  const price = (course as any)?.price ?? 0;

  if (!course) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  return (
    <>
      {showTossModal && (
        <TossModal
          amount={price}
          orderName={course.title}
          onSuccess={handleTossSuccess}
          onCancel={() => { setShowTossModal(false); setError('결제가 취소되었습니다.'); }}
        />
      )}

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
                background: 'rgba(0,100,255,0.06)', border: '1px solid rgba(0,100,255,0.2)',
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
              <button
                className="btn-primary"
                onClick={paymentType === 'toss' ? () => setShowTossModal(true) : handlePay}
              >
                {paymentType === 'toss' ? '토스페이로 결제' : '결제하기'}
              </button>
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
    </>
  );
}
