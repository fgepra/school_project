// src/app/(main)/payment/[courseId]/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { courseApi, paymentApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Course } from '@/types';

const CARD_COMPANIES = [
  { id: 'shinhan', name: '신한카드', color: '#003087' },
  { id: 'kb',      name: 'KB국민',  color: '#FFBC00' },
  { id: 'hyundai', name: '현대카드', color: '#1A1A1A' },
  { id: 'samsung', name: '삼성카드', color: '#1248B3' },
  { id: 'lotte',   name: '롯데카드', color: '#ED1C24' },
  { id: 'hana',    name: '하나카드', color: '#009B77' },
];

const INSTALLMENTS = [
  { value: 0, label: '일시불' },
  { value: 2, label: '2개월' },
  { value: 3, label: '3개월' },
  { value: 6, label: '6개월' },
];

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1-').replace(/-$/, '');
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2);
  return digits;
}

export default function PaymentPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const router = useRouter();
  const { user } = useAuth();

  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [alreadyPurchased, setAlreadyPurchased] = useState(false);

  const [selectedCard, setSelectedCard] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [installment, setInstallment] = useState(0);
  const [cardHolder, setCardHolder] = useState('');

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'form' | 'confirm' | 'processing'>('form');

  useEffect(() => {
    if (!user) return;
    const cid = Number(courseId);
    Promise.all([
      courseApi.getById(cid),
      paymentApi.checkPurchase(cid).catch(() => ({ data: { purchased: false } })),
    ]).then(([c, check]) => {
      setCourse(c);
      if (check.data?.purchased) setAlreadyPurchased(true);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [courseId, user]);

  const handleSubmit = useCallback(() => {
    setError('');
    if (!selectedCard) { setError('카드사를 선택해 주세요.'); return; }
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length !== 16) { setError('카드번호 16자리를 입력해 주세요.'); return; }
    if (expiry.length < 5) { setError('유효기간을 입력해 주세요.'); return; }
    if (cvc.length < 3) { setError('CVC 3자리를 입력해 주세요.'); return; }
    if (!cardHolder.trim()) { setError('카드 소지자 이름을 입력해 주세요.'); return; }
    setStep('confirm');
  }, [selectedCard, cardNumber, expiry, cvc, cardHolder]);

  const handleConfirmPayment = useCallback(async () => {
    if (!course) return;
    setStep('processing');
    setProcessing(true);
    await new Promise(r => setTimeout(r, 1500));
    try {
      const last4 = cardNumber.replace(/\D/g, '').slice(-4);
      await paymentApi.process({
        course_id: course.id,
        payment_method: selectedCard,
        card_last4: last4,
      });
      router.push(`/payment/complete?courseId=${course.id}&amount=${course.price}&title=${encodeURIComponent(course.title)}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : '결제에 실패했습니다.');
      setStep('form');
    } finally {
      setProcessing(false);
    }
  }, [course, cardNumber, selectedCard, router]);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;
  if (!user) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>로그인이 필요합니다.</div>;
  if (!course) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>강의를 찾을 수 없습니다.</div>;

  if (alreadyPurchased) {
    return (
      <div className="fade-in" style={{ maxWidth: 480, margin: '60px auto', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>✅</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>이미 구매한 강의입니다</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>"{course.title}"은 이미 수강 중입니다.</p>
        <button onClick={() => router.push(`/courses/${course.id}`)} style={{ padding: '12px 28px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
          강의 보러 가기
        </button>
      </div>
    );
  }

  if (step === 'processing') {
    return (
      <div className="fade-in" style={{ maxWidth: 480, margin: '80px auto', textAlign: 'center' }}>
        <div className="spinner" style={{ width: 56, height: 56, margin: '0 auto 24px' }} />
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>결제 처리 중...</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>잠시만 기다려 주세요.</p>
      </div>
    );
  }

  if (step === 'confirm') {
    const cardCo = CARD_COMPANIES.find(c => c.id === selectedCard);
    const last4 = cardNumber.replace(/\D/g, '').slice(-4);
    return (
      <div className="fade-in" style={{ maxWidth: 480, margin: '0 auto' }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 28 }}>결제 확인</h1>
        <div className="card" style={{ padding: 28, marginBottom: 16 }}>
          <h3 style={{ fontSize: 14, color: 'var(--text-secondary)', fontWeight: 600, marginBottom: 16 }}>주문 정보</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {([
              ['강의명', course.title],
              ['결제 금액', `₩${(course.price ?? 0).toLocaleString()}`],
              ['카드사', cardCo?.name ?? selectedCard],
              ['카드번호', `**** **** **** ${last4}`],
              ['할부', installment === 0 ? '일시불' : `${installment}개월`],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                <span style={{ fontWeight: 600 }}>{value}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', fontSize: 17, fontWeight: 700 }}>
              <span>최종 결제액</span>
              <span style={{ color: 'var(--accent)' }}>₩{(course.price ?? 0).toLocaleString()}</span>
            </div>
          </div>
        </div>
        {error && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 12 }}>⚠️ {error}</p>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setStep('form')} style={{ flex: 1, padding: '14px', borderRadius: 10, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>수정</button>
          <button onClick={handleConfirmPayment} disabled={processing} style={{ flex: 2, padding: '14px', borderRadius: 10, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
            ₩{(course.price ?? 0).toLocaleString()} 결제하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>결제하기</h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>{course.title}</p>

      <div className="card" style={{ padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>결제 금액</div>
          <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>
            {course.price === 0 ? '무료' : `₩${(course.price ?? 0).toLocaleString()}`}
          </div>
        </div>
        <div style={{ fontSize: 28 }}>💳</div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 14 }}>카드사 선택</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {CARD_COMPANIES.map(card => (
            <button key={card.id} onClick={() => setSelectedCard(card.id)} style={{ padding: '12px 8px', borderRadius: 10, border: `2px solid ${selectedCard === card.id ? 'var(--accent)' : 'var(--border)'}`, background: selectedCard === card.id ? 'var(--accent-dim)' : 'var(--bg-elevated)', color: selectedCard === card.id ? 'var(--accent)' : 'var(--text-primary)', fontSize: 12, fontWeight: selectedCard === card.id ? 700 : 400, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", transition: 'all 0.15s', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 28, height: 18, borderRadius: 4, background: card.color }} />
              {card.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 16 }}>카드 정보</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>카드 소지자 이름</label>
            <input className="input-field" placeholder="홍길동" value={cardHolder} onChange={e => setCardHolder(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>카드번호</label>
            <input className="input-field" placeholder="0000-0000-0000-0000" value={cardNumber} onChange={e => setCardNumber(formatCardNumber(e.target.value))} maxLength={19} style={{ width: '100%', boxSizing: 'border-box', letterSpacing: 2 }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>유효기간 (MM/YY)</label>
              <input className="input-field" placeholder="MM/YY" value={expiry} onChange={e => setExpiry(formatExpiry(e.target.value))} maxLength={5} style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>CVC</label>
              <input className="input-field" placeholder="000" value={cvc} onChange={e => setCvc(e.target.value.replace(/\D/g, '').slice(0, 3))} maxLength={3} type="password" style={{ width: '100%', boxSizing: 'border-box' }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}>할부</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {INSTALLMENTS.map(ins => (
                <button key={ins.value} onClick={() => setInstallment(ins.value)} style={{ padding: '8px 14px', borderRadius: 8, border: `1px solid ${installment === ins.value ? 'var(--accent)' : 'var(--border)'}`, background: installment === ins.value ? 'var(--accent-dim)' : 'transparent', color: installment === ins.value ? 'var(--accent)' : 'var(--text-secondary)', fontSize: 12, fontWeight: installment === ins.value ? 700 : 400, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
                  {ins.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', fontSize: 13, color: '#ef4444', marginBottom: 14 }}>⚠️ {error}</div>}

      <button onClick={handleSubmit} style={{ width: '100%', padding: '16px', borderRadius: 12, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif", marginBottom: 12 }}>
        ₩{(course.price ?? 0).toLocaleString()} 결제하기
      </button>
      <p style={{ fontSize: 11, color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.6 }}>
        🔒 결제 정보는 암호화되어 안전하게 처리됩니다. 구매 후 7일 이내 환불 가능합니다.
      </p>
    </div>
  );
}
