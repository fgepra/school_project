'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { notificationApi } from '@/lib/api';
import { Notification } from '@/types';

const TYPE_ICON: Record<string, string> = {
  payment: '💳',
  course_update: '📚',
  progress: '🏃',
  system: '🔔',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(() => {
    if (!user) return;
    notificationApi.getAll()
      .then(res => setNotifications(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const handleMarkAsRead = async (id: number) => {
    await notificationApi.markAsRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
  };

  const handleMarkAllAsRead = async () => {
    await notificationApi.markAllAsRead();
    setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 as 1 })));
  };

  const handleDelete = async (id: number) => {
    await notificationApi.delete(id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>알림</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
            미읽음 {unreadCount}개
          </p>
        </div>
        {unreadCount > 0 && (
          <button className="btn-secondary" onClick={handleMarkAllAsRead} style={{ fontSize: 13 }}>
            전체 읽음
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="card" style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
          알림이 없습니다.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map(n => (
            <div key={n.id} className="card" style={{
              padding: 16,
              display: 'flex', alignItems: 'flex-start', gap: 12,
              background: n.is_read ? undefined : 'rgba(99,102,241,0.06)',
              borderLeft: n.is_read ? undefined : '3px solid var(--primary)',
              cursor: n.is_read ? undefined : 'pointer',
            }}
              onClick={() => !n.is_read && handleMarkAsRead(n.id)}
            >
              <span style={{ fontSize: 22 }}>{TYPE_ICON[n.type] ?? '🔔'}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: n.is_read ? 400 : 700, marginBottom: 4 }}>{n.title}</div>
                {n.message && <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{n.message}</div>}
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>
                  {new Date(n.created_at).toLocaleString('ko-KR')}
                </div>
              </div>
              {!n.is_read && (
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', marginTop: 4, flexShrink: 0 }} />
              )}
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16, padding: 4 }}
              >✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
