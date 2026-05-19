// src/app/(main)/notifications/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { notificationApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { Notification } from '@/types';
import ConfirmModal from '@/components/ui/ConfirmModal';

const TYPE_ICON: Record<string, string> = {
  reply:    '💬',
  comment:  '🗨️',
  purchase: '💳',
  system:   '🔔',
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<number | null>(null);
  const [navigatingId, setNavigatingId] = useState<number | null>(null);

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

  const handleDeleteConfirm = async () => {
    if (deleteModal === null) return;
    const id = deleteModal;
    setDeleteModal(null);
    await notificationApi.delete(id).catch(() => {});
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleMarkRead = async (id: number) => {
    await notificationApi.markAsRead(id).catch(() => {});
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 as const } : n));
  };

  // reply 알림 클릭 → 읽음 처리 후 강의 페이지로 이동
  const handleNotificationClick = async (n: Notification) => {
    if (n.type !== 'reply') {
      // reply가 아니면 기존 읽음 처리만
      if (n.is_read === 0) handleMarkRead(n.id);
      return;
    }
    setNavigatingId(n.id);
    try {
      // 읽음 처리
      if (n.is_read === 0) {
        await notificationApi.markAsRead(n.id).catch(() => {});
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: 1 as const } : item));
      }
      // 이동 경로 조회
      const res = await notificationApi.getLink(n.id);
      if (res.success && res.data?.path) {
        router.push(res.data.path);
      }
    } catch {
      // 링크 조회 실패 시 그냥 읽음 처리만
    } finally {
      setNavigatingId(null);
    }
  };

  const unreadCount = notifications.filter(n => n.is_read === 0).length;

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;
  if (!user) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>로그인이 필요합니다.</div>;

  return (
    <div className="fade-in">
      <ConfirmModal
        isOpen={deleteModal !== null}
        title="알림 삭제"
        message="이 알림을 삭제하시겠습니까?"
        confirmLabel="삭제"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteModal(null)}
      />

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
          {notifications.map(n => {
            const isReply = n.type === 'reply';
            const isNavigating = navigatingId === n.id;
            const isClickable = isReply || n.is_read === 0;

            return (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              style={{
                padding: '16px 20px',
                borderRadius: 12,
                background: n.is_read === 0 ? 'var(--accent-dim)' : 'var(--bg-card)',
                border: `1px solid ${n.is_read === 0 ? 'var(--accent)' : 'var(--border)'}`,
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
                cursor: isClickable ? 'pointer' : 'default',
                transition: 'background 0.15s, opacity 0.15s',
                opacity: isNavigating ? 0.6 : 1,
              }}
            >
              <div style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>
                {isNavigating ? '⏳' : (TYPE_ICON[n.type] ?? '🔔')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: n.is_read === 0 ? 700 : 600, color: n.is_read === 0 ? 'var(--accent)' : 'var(--text-primary)' }}>
                    {n.title}
                    {n.is_read === 0 && <span style={{ marginLeft: 8, width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block', verticalAlign: 'middle' }} />}
                    {isReply && n.is_read === 1 && (
                      <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-secondary)', fontWeight: 400 }}>
                        → 강의로 이동
                      </span>
                    )}
                  </span>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', flexShrink: 0, marginLeft: 8 }}>
                    {new Date(n.created_at).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                {n.message && <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{n.message}</p>}
              </div>
              <button
                onClick={e => { e.stopPropagation(); setDeleteModal(n.id); }}
                style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 16, flexShrink: 0, padding: '0 4px', lineHeight: 1 }}
              >
                ×
              </button>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
