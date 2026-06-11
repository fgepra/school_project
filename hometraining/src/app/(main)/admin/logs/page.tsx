'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { logApi } from '@/lib/api';
import { ActivityLog } from '@/types';

const ACTIONS = ['', 'POST /auth/login', 'POST /auth/register', 'POST /progress', 'POST /payments', 'GET /courses', 'GET /lectures'];

export default function AdminLogsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchLogs = useCallback(() => {
    setLoading(true);
    logApi.getLogs(actionFilter ? { action: actionFilter } : undefined)
      .then(res => setLogs(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [actionFilter]);

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard');
  }, [user, router]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const handleDeleteOld = async () => {
    if (!confirm('30일 이상 오래된 로그를 삭제하시겠습니까?')) return;
    setDeleting(true);
    try {
      const res = await logApi.deleteOldLogs();
      alert(`${res.data?.deleted ?? 0}건의 로그가 삭제되었습니다.`);
      fetchLogs();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>활동 로그</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>총 {logs.length}건</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <select className="input" value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ minWidth: 160 }}>
            {ACTIONS.map(a => <option key={a} value={a}>{a || '전체 액션'}</option>)}
          </select>
          <button className="btn-secondary" onClick={handleDeleteOld} disabled={deleting} style={{ fontSize: 13, color: 'var(--red)' }}>
            {deleting ? '삭제 중...' : '30일+ 로그 삭제'}
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
      ) : (
        <div className="card" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['시각', '유저 ID', 'IP', '액션', '상세'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '8px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {new Date(log.created_at).toLocaleString('ko-KR')}
                  </td>
                  <td style={{ padding: '8px 16px', color: 'var(--text-secondary)' }}>{log.user_id ?? '-'}</td>
                  <td style={{ padding: '8px 16px', color: 'var(--text-secondary)', fontFamily: 'monospace', fontSize: 12 }}>{log.ip_address ?? '-'}</td>
                  <td style={{ padding: '8px 16px', fontFamily: 'monospace', fontSize: 12 }}>{log.action}</td>
                  <td style={{ padding: '8px 16px', color: 'var(--text-secondary)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>
                    {log.detail ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {logs.length === 0 && (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>로그가 없습니다.</div>
          )}
        </div>
      )}
    </div>
  );
}
