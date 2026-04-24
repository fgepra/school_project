// src/app/(main)/admin/monitor/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { monitorApi } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { HealthStatus, MonitorStats } from '@/types';

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}일 ${h}시간 ${m}분`;
  if (h > 0) return `${h}시간 ${m}분`;
  return `${m}분`;
}

function formatBytes(bytes: number): string {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function AdminMonitorPage() {
  const { user } = useAuth();
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [stats, setStats] = useState<MonitorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [hRes, sRes] = await Promise.all([monitorApi.health(), monitorApi.getStats()]);
      setHealth(hRes.data ?? null);
      setStats(sRes.data ?? null);
      setLastRefresh(new Date());
    } catch {
      // 서버 응답 없으면 null 유지
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    fetchData();
    const timer = setInterval(fetchData, 15000); // 15초 자동 갱신
    return () => clearInterval(timer);
  }, [user, fetchData]);

  if (!user || user.role !== 'admin') return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-secondary)' }}>접근 권한이 없습니다.</div>;
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>;

  const isHealthy = health?.status === 'ok' && health?.db === 'connected';

  return (
    <div className="fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 700 }}>서버 모니터링</h1>
          <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
            마지막 갱신: {lastRefresh.toLocaleTimeString('ko-KR')} &nbsp;(15초 자동 갱신)
          </p>
        </div>
        <button onClick={fetchData} style={{ padding: '9px 18px', borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', color: 'var(--text-primary)', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: "'Noto Sans KR', sans-serif" }}>
          🔄 새로 고침
        </button>
      </div>

      {/* 헬스체크 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 20 }}>
        <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16, border: `1px solid ${isHealthy ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)'}` }}>
          <div style={{ fontSize: 40 }}>{isHealthy ? '✅' : '❌'}</div>
          <div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>서버 상태</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: isHealthy ? '#22c55e' : '#ef4444' }}>
              {isHealthy ? '정상 운영 중' : '점검 필요'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>
              DB: {health?.db === 'connected' ? '연결됨' : '연결 끊김'}
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12 }}>서버 정보</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            {health && [
              ['업타임', formatUptime(health.uptime)],
              ['Node.js', health.nodeVersion],
              ['메모리 (RSS)', formatBytes(health.memory.rss)],
              ['힙 사용량', `${formatBytes(health.memory.heapUsed)} / ${formatBytes(health.memory.heapTotal)}`],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
                <span style={{ fontWeight: 600, fontFamily: 'monospace' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API 통계 */}
      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
            {[
              { label: '총 요청 수', value: stats.totalRequests.toLocaleString(), icon: '📡' },
              { label: '에러 수',    value: stats.errorCount.toLocaleString(),    icon: '⚠️' },
              { label: '에러율',     value: `${stats.errorRate.toFixed(1)}%`,      icon: '📉' },
              { label: '평균 응답',  value: `${stats.avgResponseTime.toFixed(0)}ms`, icon: '⚡' },
            ].map(item => (
              <div key={item.label} className="card" style={{ padding: '16px 18px' }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{item.icon}</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4 }}>{item.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>{item.value}</div>
              </div>
            ))}
          </div>

          {/* 최근 요청 로그 */}
          {stats.recentRequests.length > 0 && (
            <div className="card" style={{ overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', fontSize: 14, fontWeight: 700 }}>최근 요청</div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['시각', '메서드', '경로', '상태', '응답시간'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentRequests.slice(0, 20).map((req, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                        <td style={{ padding: '9px 14px', color: 'var(--text-secondary)', fontSize: 11, whiteSpace: 'nowrap' }}>{new Date(req.timestamp).toLocaleTimeString('ko-KR')}</td>
                        <td style={{ padding: '9px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: req.method === 'GET' ? '#60a5fa' : req.method === 'POST' ? '#22c55e' : '#f59e0b' }}>{req.method}</span>
                        </td>
                        <td style={{ padding: '9px 14px', fontFamily: 'monospace', fontSize: 12, color: 'var(--text-secondary)' }}>{req.path}</td>
                        <td style={{ padding: '9px 14px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: req.status < 300 ? '#22c55e' : req.status < 400 ? '#f59e0b' : '#ef4444' }}>{req.status}</span>
                        </td>
                        <td style={{ padding: '9px 14px', color: req.duration > 500 ? '#f59e0b' : 'var(--text-secondary)', fontWeight: req.duration > 500 ? 700 : 400 }}>{req.duration}ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
