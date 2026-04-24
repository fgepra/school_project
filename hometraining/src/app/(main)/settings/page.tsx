// src/app/(main)/settings/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { profileApi } from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();

  // 비밀번호 변경 상태
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');

  // 회원 탈퇴 상태
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');

    if (newPassword !== newPasswordConfirm) {
      setPwError('새 비밀번호가 일치하지 않습니다.');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('새 비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    setPwLoading(true);
    try {
      await profileApi.changePassword(currentPassword, newPassword);
      setPwSuccess('비밀번호가 성공적으로 변경되었습니다.');
      setCurrentPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err) {
      setPwError(err instanceof Error ? err.message : '비밀번호 변경에 실패했습니다.');
    } finally {
      setPwLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError('');
    if (!deletePassword) {
      setDeleteError('비밀번호를 입력해 주세요.');
      return;
    }
    const confirmed = window.confirm(
      '정말로 탈퇴하시겠습니까? 모든 데이터가 삭제됩니다.'
    );
    if (!confirmed) return;

    setDeleteLoading(true);
    try {
      await profileApi.deleteAccount(deletePassword);
      localStorage.removeItem('token');
      router.push('/courses');
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : '회원 탈퇴에 실패했습니다.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ maxWidth: 560 }}>
      {/* 헤더 */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>설정</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
          계정 보안 및 개인 정보를 관리하세요.
        </p>
      </div>

      {/* 비밀번호 변경 섹션 */}
      <div className="card" style={{ padding: 28, marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>비밀번호 변경</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          현재 비밀번호를 확인한 후 새 비밀번호로 변경합니다.
        </p>

        <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}
            >
              현재 비밀번호
            </label>
            <input
              className="input-field"
              type="password"
              placeholder="현재 비밀번호 입력"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}
            >
              새 비밀번호
            </label>
            <input
              className="input-field"
              type="password"
              placeholder="새 비밀번호 입력 (6자 이상)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          <div>
            <label
              style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}
            >
              새 비밀번호 확인
            </label>
            <input
              className="input-field"
              type="password"
              placeholder="새 비밀번호 재입력"
              value={newPasswordConfirm}
              onChange={(e) => setNewPasswordConfirm(e.target.value)}
              required
            />
          </div>

          {pwError && (
            <p
              style={{
                fontSize: 13,
                color: 'var(--accent)',
                background: 'var(--accent-dim)',
                padding: '10px 14px',
                borderRadius: 8,
              }}
            >
              {pwError}
            </p>
          )}
          {pwSuccess && (
            <p
              style={{
                fontSize: 13,
                color: 'var(--green)',
                background: 'rgba(74,222,128,0.1)',
                padding: '10px 14px',
                borderRadius: 8,
              }}
            >
              {pwSuccess}
            </p>
          )}

          <button
            className="btn-primary"
            type="submit"
            disabled={pwLoading}
            style={{ padding: '11px', fontSize: 14 }}
          >
            {pwLoading ? '변경 중...' : '비밀번호 변경'}
          </button>
        </form>
      </div>

      {/* 회원 탈퇴 섹션 */}
      <div
        className="card"
        style={{
          padding: 28,
          border: '1px solid rgba(239,68,68,0.4)',
          background: 'rgba(239,68,68,0.04)',
        }}
      >
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>
          회원 탈퇴
        </h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
          탈퇴 시 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label
              style={{ fontSize: 12, color: 'var(--text-secondary)', display: 'block', marginBottom: 6 }}
            >
              비밀번호 확인
            </label>
            <input
              className="input-field"
              type="password"
              placeholder="현재 비밀번호 입력"
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
            />
          </div>

          {deleteError && (
            <p
              style={{
                fontSize: 13,
                color: '#ef4444',
                background: 'rgba(239,68,68,0.1)',
                padding: '10px 14px',
                borderRadius: 8,
              }}
            >
              {deleteError}
            </p>
          )}

          <button
            style={{
              padding: '11px',
              fontSize: 14,
              fontWeight: 600,
              borderRadius: 8,
              border: '1px solid rgba(239,68,68,0.5)',
              background: 'transparent',
              color: '#ef4444',
              cursor: deleteLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s',
            }}
            disabled={deleteLoading}
            onClick={handleDeleteAccount}
          >
            {deleteLoading ? '처리 중...' : '회원 탈퇴'}
          </button>
        </div>
      </div>
    </div>
  );
}
