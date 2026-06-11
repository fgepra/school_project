'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Subscription } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function apiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: token } : {}), ...options.headers },
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.message || '요청 실패');
  return json;
}

const SUB_TYPES = [
  { type: 'weekly_digest', label: '주간 다이제스트', desc: '매주 월요일 오전 수강 독려 + 추천 강의 이메일' },
  { type: 'course_update', label: '강의 업데이트', desc: '새 강의 또는 강의 내용 변경 시 알림' },
  { type: 'promotion', label: '프로모션', desc: '할인 이벤트 및 특별 혜택 알림' },
];

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [subs, setSubs] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchSubs = useCallback(() => {
    if (!user) return;
    apiFetch<{ success: boolean; data: Subscription[] }>('/subscriptions')
      .then(res => {
        const map: Record<string, boolean> = {};
        (res.data ?? []).forEach(s => { map[s.type] = s.is_active === 1; });
        setSubs(map);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { fetchSubs(); }, [fetchSubs]);

  const handleToggle = async (type: string) => {
    setSaving(type);
    const newValue = !subs[type];
    try {
      await apiFetch('/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ type, is_active: newValue }),
      });
      setSubs(prev => ({ ...prev, [type]: newValue }));
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  return (
    <div className="fade-in" style={{ maxWidth: 600 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>이메일 구독 설정</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
          이메일 수신 설정을 관리합니다. ({user?.email})
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {SUB_TYPES.map(({ type, label, desc }) => (
          <div key={type} className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</div>
            </div>
            <button
              onClick={() => handleToggle(type)}
              disabled={saving === type}
              style={{
                width: 52, height: 28, borderRadius: 14, border: 'none', cursor: 'pointer',
                background: subs[type] ? 'var(--primary)' : 'var(--border)',
                position: 'relative', transition: 'background 0.2s', flexShrink: 0,
                opacity: saving === type ? 0.5 : 1,
              }}
            >
              <span style={{
                position: 'absolute', top: 4, left: subs[type] ? 26 : 4,
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                transition: 'left 0.2s',
              }} />
            </button>
          </div>
        ))}
      </div>

      <p style={{ marginTop: 24, fontSize: 12, color: 'var(--text-secondary)' }}>
        * 이메일 발송은 서버 환경변수(MAIL_USER, MAIL_PASS)가 설정된 경우에만 실제로 발송됩니다.
      </p>
    </div>
  );
}
