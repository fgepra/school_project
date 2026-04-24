// src/app/(main)/admin/logs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { logApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { ActivityLog } from '@/types';

export default function AdminLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchLogs = (action?: string) => {
    setLoading(true);
    logApi.getLogs(action ? { action } : undefined)
      .then(res => setLogs(res.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    fetchLogs();
  }, [user]);

  const handleFilter = () => fetchLogs(actionFilter || undefined);

  const handleDeleteOld = async () => {
    if (!window.confirm('30일 이상 된 로그를 삭제하시겠습니까?')) return;
    setDeleting(true);
    try {
      const res = await logApi.deleteOldLogs();
      alert(`${res.data?.deleted ?? 0}개의 로그가 삭제되었습니다.`);
      fetchLogs();
    } catch {
      alert('삭제에 실패했습니다.');
    } finally {
      setDeleting(false);
    }
  };

  const actions = [...new Set(logs.map(l => l.action))];

  if (!user || user.role !== 'admin') return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>접근 권한이 없습니다.</div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>활동 로그</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>서버 요청 및 사용자 활동 로그를 조회합니다.</p>
        </div>
        <button onClick={handleDeleteOld} disabled={deleting} style={{ padding: '9px 18px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: 13, fontWeight: 600, cursor: deleting ? 'not-allowed' : 'pointer', opacity: deleting ? 0.6 : 1, fontFamily: "'Noto Sans KR', sans-serif" }}>
          {deleting ? '삭제 중...' : '🗑 30일 이상 삭제'}
        </button>
      </div>

      {/* 필터 */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, outline: 'none', fontFamily: "'Noto Sans KR', sans-serif" }}
        >
          <option value="">전체 액션</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button onClick={handleFilter} style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--accent)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
          필터 적용
        </button>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 'auto' }}>총 {logs.length}개</span>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['시각', '액션', '사용자', 'IP', '상세'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr><td colSpan={5} style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-secondary)' }}>로그가 없습니다.</td></tr>
                ) : logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {new Date(log.created_at).toLocaleString('ko-KR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 12, fontWeight: 600, background: 'var(--accent-dim)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 20 }}>{log.action}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)' }}>{log.user_name ?? (log.user_id ? `#${log.user_id}` : '비로그인')}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 12 }}>{log.ip_address ?? '-'}</td>
                    <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{log.detail ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
