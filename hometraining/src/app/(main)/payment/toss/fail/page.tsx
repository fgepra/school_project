'use client';

import { useSearchParams, useRouter } from 'next/navigation';

export default function TossFailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const message = searchParams.get('message') || '결제가 취소되었습니다.';
  const courseId = searchParams.get('courseId');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16 }}>
      <div style={{ fontSize: 48 }}>❌</div>
      <p style={{ fontWeight: 700, fontSize: 18 }}>결제 실패</p>
      <p style={{ color: 'var(--text-secondary)' }}>{message}</p>
      <div style={{ display: 'flex', gap: 12 }}>
        <button className="btn-secondary" onClick={() => router.push('/courses')}>강의 목록</button>
        {courseId && (
          <button className="btn-primary" onClick={() => router.push(`/payment/${courseId}`)}>다시 시도</button>
        )}
      </div>
    </div>
  );
}
