// src/app/(main)/notifications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { notificationApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Notification } from '@/types';

const TYPE_ICON: Record<string, string> = {
  reply:    '💬',
  comment:  '🗨️',
  purchase: '💳',
  system:   '🔔',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    notificationApi.getAll()
      .then(res => setNotifications(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user]);

  const handleMarkAllRead = async () => {
    await notificationApi.markAllAsRead().catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 as const })));
  };

  const handleDelete = async (id: number) => {
    await notificationApi.delete(id).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkRead = async (id: number) => {
    await notificationApi.markAsRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 as const } : n));
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;
  if (!user) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>로그인이 필요합니다.</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>알림</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
            {unreadCount > 0 ? `읽지 않은 알림 ${unreadCount}개` : '모든 알림을 읽었습니다.'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: 13, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
            전체 읽음
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
          <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>알림이 없습니다</p>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>새로운 알림이 오면 여기에 표시됩니다.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => (
            <div
              key={n.id}
              onClick={() => n.is_read === 0 && handleMarkRead(n.id)}
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: n.is_read === 0 ? 'var(--accent-dim)' : 'var(--bg-card)',
                border: `1px solid ${n.is_read === 0 ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                cursor: n.is_read === 0 ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
            >
              <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>{TYPE_ICON[n.type] ?? '🔔'}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: n.is_read === 0 ? 700 : 600, color: n.is_read === 0 ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {n.title}
                    {n.is_read === 0 && <span style={{ marginLeft: 8, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', verticalAlign: 'middle' }} />}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 8 }}>
                    {new Date(n.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {n.message && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{n.message}</p>}
              </div>
              <button
                onClick={e => { e.stopPropagation(); handleDelete(n.id); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: '0 4px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
