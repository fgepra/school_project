'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { monitorApi } from '@/lib/api';
import { HealthStatus, MonitorStats } from '@/types';

const METHOD_COLOR: Record<string, string> = { GET: '#22c55e', POST: '#3b82f6', PUT: '#f59e0b', DELETE: '#ef4444', PATCH: '#a855f7' };

export default function AdminMonitorPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<MonitorStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [h, s] = await Promise.all([
        monitorApi.health().then(r => r.data),
        monitorApi.getStats().then(r => r.data),
      ]);
      setHealth(h ?? null);
      setStats(s ?? null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role !== 'admin') router.push('/dashboard');
  }, [user, router]);

  useEffect(() => {
    fetchData();
    const timer = setInterval(fetchData, 15000);
    return () => clearInterval(timer);
  }, [fetchData]);

  const formatBytes = (b: number) => `${(b / 1024 / 1024).toFixed(1)} MB`;
  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return `${h}시간 ${m}분`;
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>서버 모니터링</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginTop: 6 }}>15초 자동 갱신</p>
        </div>
        <button className="btn-secondary" onClick={fetchData} style={{ fontSize: 13 }}>새로고침</button>
      </div>

      {/* 헬스체크 */}
      {health && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div className="card" style={{ padding: 20, borderLeft: `4px solid ${health.status === 'ok' ? 'var(--green)' : 'var(--red)'}` }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>서버 상태</div>
            <div style={{ fontWeight: 800, color: health.status === 'ok' ? 'var(--green)' : 'var(--red)' }}>
              {health.status === 'ok' ? '정상' : '점검 필요'}
            </div>
          </div>
          <div className="card" style={{ padding: 20, borderLeft: `4px solid ${health.db === 'connected' ? 'var(--green)' : 'var(--red)'}` }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>DB 연결</div>
            <div style={{ fontWeight: 800, color: health.db === 'connected' ? 'var(--green)' : 'var(--red)' }}>
              {health.db === 'connected' ? '연결됨' : '끊김'}
            </div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>업타임</div>
            <div style={{ fontWeight: 800 }}>{formatUptime(health.uptime)}</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>Node.js</div>
            <div style={{ fontWeight: 800 }}>{health.nodeVersion}</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>RSS 메모리</div>
            <div style={{ fontWeight: 800 }}>{formatBytes(health.memory.rss)}</div>
          </div>
          <div className="card" style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>힙 사용</div>
            <div style={{ fontWeight: 800 }}>{formatBytes(health.memory.heapUsed)} / {formatBytes(health.memory.heapTotal)}</div>
          </div>
        </div>
      )}

      {/* API 통계 */}
      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 24 }}>
            {[
              { label: '총 요청 수', value: stats.totalRequests.toLocaleString() },
              { label: '에러 수', value: stats.errorCount.toLocaleString(), color: stats.errorCount > 0 ? 'var(--red)' : undefined },
              { label: '에러율', value: `${stats.errorRate}%`, color: stats.errorRate > 5 ? 'var(--red)' : stats.errorRate > 1 ? 'var(--yellow)' : undefined },
              { label: '평균 응답시간', value: `${stats.avgResponseTime}ms`, color: stats.avgResponseTime > 500 ? 'var(--red)' : undefined },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: 20 }}>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 6 }}>{s.label}</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color || 'var(--text)' }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* 최근 요청 */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700 }}>최근 요청</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['메서드', '경로', '상태', '응답시간', '시각'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 500 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {stats.recentRequests.slice(0, 20).map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '8px 16px' }}>
                      <span style={{ color: METHOD_COLOR[r.method] || 'var(--text)', fontWeight: 700 }}>{r.method}</span>
                    </td>
                    <td style={{ padding: '8px 16px', fontFamily: 'monospace', fontSize: 12 }}>{r.path}</td>
                    <td style={{ padding: '8px 16px', color: r.status >= 500 ? 'var(--red)' : r.status >= 400 ? 'var(--yellow)' : 'var(--green)', fontWeight: 600 }}>{r.status}</td>
                    <td style={{ padding: '8px 16px', color: r.duration > 500 ? 'var(--red)' : 'var(--text-secondary)' }}>{r.duration}ms</td>
                    <td style={{ padding: '8px 16px', color: 'var(--text-secondary)', fontSize: 12 }}>
                      {new Date(r.timestamp).toLocaleTimeString('ko-KR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
