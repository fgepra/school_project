'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';

type LectureRow = {
  id: number;
  title: string;
  course_title: string;
  instructor_name: string;
  is_hidden: number;
  hidden_by_admin: number;
};

type PublishRequest = {
  id: number;
  lecture_id: number;
  lecture_title: string;
  course_title: string;
  instructor_name: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string | null;
  created_at: string;
  reviewed_at: string | null;
};

export default function AdminLecturesPage() {
  const [tab, setTab] = useState<'lectures' | 'requests'>('lectures');
  const [lectures, setLectures] = useState<LectureRow[]>([]);
  const [requests, setRequests] = useState<PublishRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const loadLectures = () =>
    adminApi.getAllLectures().then((r) => setLectures(r.data));

  const loadRequests = () =>
    adminApi.getPublishRequests().then((r) => setRequests(r.data));

  useEffect(() => {
    setLoading(true);
    Promise.all([loadLectures(), loadRequests()])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleHide = async (id: number) => {
    if (!confirm('이 강의 영상을 비공개 처리하시겠습니까?')) return;
    setActionLoading(id);
    try {
      await adminApi.hideLecture(id);
      await loadLectures();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnhide = async (id: number) => {
    if (!confirm('이 강의 영상을 공개 처리하시겠습니까?')) return;
    setActionLoading(id);
    try {
      await adminApi.unhideLecture(id);
      await loadLectures();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('공개 요청을 승인하시겠습니까?')) return;
    setActionLoading(id);
    try {
      await adminApi.approvePublishRequest(id);
      await Promise.all([loadLectures(), loadRequests()]);
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    setActionLoading(id);
    try {
      await adminApi.rejectPublishRequest(id, rejectNote);
      setRejectingId(null);
      setRejectNote('');
      await loadRequests();
    } catch (e) {
      alert(e instanceof Error ? e.message : '오류가 발생했습니다.');
    } finally {
      setActionLoading(null);
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '10px 24px',
    fontWeight: 600,
    fontSize: 14,
    border: 'none',
    cursor: 'pointer',
    borderBottom: active ? '2px solid var(--accent)' : '2px solid transparent',
    background: 'transparent',
    color: active ? 'var(--accent)' : 'var(--text-secondary)',
  });

  const badgeStyle = (hidden: boolean): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background: hidden ? 'rgba(239,68,68,0.15)' : 'rgba(74,222,128,0.15)',
    color: hidden ? '#ef4444' : 'var(--green)',
  });

  const statusBadge = (status: string): React.CSSProperties => ({
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    background:
      status === 'pending' ? 'rgba(251,191,36,0.15)' :
      status === 'approved' ? 'rgba(74,222,128,0.15)' :
      'rgba(239,68,68,0.15)',
    color:
      status === 'pending' ? '#fbbf24' :
      status === 'approved' ? 'var(--green)' :
      '#ef4444',
  });

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>강의 영상 관리</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 4, fontSize: 14 }}>
          강의 영상 비공개 처리 및 공개 요청 심사
        </p>
      </div>

      {/* 탭 */}
      <div style={{ borderBottom: '1px solid var(--border)', marginBottom: 24, display: 'flex' }}>
        <button style={tabStyle(tab === 'lectures')} onClick={() => setTab('lectures')}>
          전체 강의 ({lectures.length})
        </button>
        <button style={tabStyle(tab === 'requests')} onClick={() => setTab('requests')}>
          공개 요청 ({requests.filter((r) => r.status === 'pending').length})
        </button>
      </div>

      {/* 전체 강의 탭 */}
      {tab === 'lectures' && (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['강의 제목', '코스', '강사', '상태', '액션'].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: 'var(--text-secondary)', fontWeight: 600, fontSize: 13 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {lectures.map((lec) => (
                <tr key={lec.id} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 500 }}>{lec.title}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{lec.course_title}</td>
                  <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>{lec.instructor_name}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={badgeStyle(!!lec.is_hidden)}>
                      {lec.is_hidden ? '비공개' : '공개'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {lec.is_hidden ? (
                      <button
                        className="btn-secondary"
                        style={{ padding: '6px 14px', fontSize: 12 }}
                        disabled={actionLoading === lec.id}
                        onClick={() => handleUnhide(lec.id)}
                      >
                        {actionLoading === lec.id ? '처리 중...' : '공개 복구'}
                      </button>
                    ) : (
                      <button
                        style={{
                          padding: '6px 14px', fontSize: 12, borderRadius: 6,
                          border: '1px solid rgba(239,68,68,0.4)', background: 'transparent',
                          color: '#ef4444', cursor: 'pointer',
                        }}
                        disabled={actionLoading === lec.id}
                        onClick={() => handleHide(lec.id)}
                      >
                        {actionLoading === lec.id ? '처리 중...' : '비공개'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {lectures.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
                    등록된 강의 영상이 없습니다.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* 공개 요청 탭 */}
      {tab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.length === 0 && (
            <div className="card" style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
              공개 요청이 없습니다.
            </div>
          )}
          {requests.map((req) => (
            <div key={req.id} className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 15 }}>{req.lecture_title}</span>
                    <span style={statusBadge(req.status)}>
                      {req.status === 'pending' ? '검토 중' : req.status === 'approved' ? '승인됨' : '거절됨'}
                    </span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                    {req.course_title} · {req.instructor_name}
                  </div>
                  {req.reason && (
                    <div style={{ fontSize: 13, marginTop: 6, padding: '8px 12px', background: 'var(--bg-elevated)', borderRadius: 6 }}>
                      <span style={{ color: 'var(--text-secondary)' }}>요청 사유: </span>{req.reason}
                    </div>
                  )}
                  {req.admin_note && (
                    <div style={{ fontSize: 13, marginTop: 6, color: 'var(--text-secondary)' }}>
                      관리자 메모: {req.admin_note}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                    요청일: {new Date(req.created_at).toLocaleString('ko-KR')}
                    {req.reviewed_at && ` · 검토일: ${new Date(req.reviewed_at).toLocaleString('ko-KR')}`}
                  </div>
                </div>

                {req.status === 'pending' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                    <button
                      className="btn-primary"
                      style={{ padding: '7px 18px', fontSize: 13 }}
                      disabled={actionLoading === req.id}
                      onClick={() => handleApprove(req.id)}
                    >
                      승인
                    </button>
                    <button
                      style={{
                        padding: '7px 18px', fontSize: 13, borderRadius: 6,
                        border: '1px solid rgba(239,68,68,0.4)', background: 'transparent',
                        color: '#ef4444', cursor: 'pointer',
                      }}
                      disabled={actionLoading === req.id}
                      onClick={() => { setRejectingId(req.id); setRejectNote(''); }}
                    >
                      거절
                    </button>
                  </div>
                )}
              </div>

              {/* 거절 사유 입력 */}
              {rejectingId === req.id && (
                <div style={{ marginTop: 14, padding: '14px 16px', background: 'var(--bg-elevated)', borderRadius: 8, border: '1px solid var(--border)' }}>
                  <label style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>거절 사유 입력</label>
                  <textarea
                    rows={3}
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="강사에게 전달할 거절 사유를 입력하세요."
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: 'var(--bg)', border: '1px solid var(--border)',
                      borderRadius: 6, padding: '8px 12px',
                      color: 'var(--text-primary)', fontSize: 13,
                      resize: 'vertical', outline: 'none',
                      fontFamily: "'Noto Sans KR', sans-serif",
                    }}
                  />
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <button
                      style={{
                        padding: '7px 18px', fontSize: 13, borderRadius: 6,
                        border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.1)',
                        color: '#ef4444', cursor: 'pointer', fontWeight: 600,
                      }}
                      disabled={actionLoading === req.id}
                      onClick={() => handleReject(req.id)}
                    >
                      {actionLoading === req.id ? '처리 중...' : '거절 확인'}
                    </button>
                    <button
                      className="btn-ghost"
                      style={{ padding: '7px 18px', fontSize: 13 }}
                      onClick={() => { setRejectingId(null); setRejectNote(''); }}
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
