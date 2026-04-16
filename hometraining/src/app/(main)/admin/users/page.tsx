// src/app/(main)/admin/users/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { adminApi } from '@/lib/api';
import { User, UserRole } from '@/types';
import { useAuth } from '@/hooks/useAuth';

const ROLE_LABEL: Record<string, string> = {
  student: '학생',
  instructor: '강사',
  admin: '관리자',
};

const ROLE_COLOR: Record<string, string> = {
  student: 'var(--text-secondary)',
  instructor: '#60a5fa',
  admin: 'var(--accent)',
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<Omit<User, 'password'>[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    adminApi.getUsers()
      .then(setUsers)
      .catch(() => setError('유저 목록을 불러오는데 실패했습니다.'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    setUpdatingId(userId);
    try {
      await adminApi.updateUserRole(userId, newRole);
      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );
    } catch (err) {
      alert(err instanceof Error ? err.message : '역할 변경에 실패했습니다.');
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700 }}>유저 관리</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6 }}>
          전체 유저 목록 및 역할을 관리합니다.
        </p>
      </div>

      {error && (
        <div className="card" style={{ padding: 16, color: 'var(--accent)', marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div className="card" style={{ overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['ID', '이름', '이메일', '체중', '역할', '가입일', '역할 변경'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '14px 16px',
                    textAlign: 'left',
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isSelf = u.id === currentUser?.id;
              const isUpdating = updatingId === u.id;

              return (
                <tr
                  key={u.id}
                  style={{
                    borderBottom: '1px solid var(--border)',
                    background: isSelf ? 'var(--bg-elevated)' : 'transparent',
                  }}
                >
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {u.id}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 14, fontWeight: 600 }}>
                    {u.name}
                    {isSelf && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--accent)' }}>(나)</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {u.email}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 13, color: 'var(--text-secondary)' }}>
                    {u.weight ? `${u.weight}kg` : '-'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: ROLE_COLOR[u.role],
                        background: `${ROLE_COLOR[u.role]}20`,
                        padding: '3px 10px',
                        borderRadius: 20,
                      }}
                    >
                      {ROLE_LABEL[u.role]}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--text-secondary)' }}>
                    {u.created_at ? new Date(u.created_at).toLocaleDateString('ko-KR') : '-'}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {isSelf ? (
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>변경 불가</span>
                    ) : (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {(['student', 'instructor', 'admin'] as UserRole[]).map((r) => (
                          <button
                            key={r}
                            disabled={u.role === r || isUpdating}
                            onClick={() => handleRoleChange(u.id, r)}
                            style={{
                              padding: '4px 10px',
                              borderRadius: 6,
                              fontSize: 11,
                              fontWeight: 600,
                              border: `1px solid ${ROLE_COLOR[r]}`,
                              background: u.role === r ? `${ROLE_COLOR[r]}30` : 'transparent',
                              color: u.role === r ? ROLE_COLOR[r] : 'var(--text-secondary)',
                              cursor: u.role === r ? 'default' : 'pointer',
                              opacity: isUpdating ? 0.5 : 1,
                            }}
                          >
                            {ROLE_LABEL[r]}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-secondary)' }}>
            유저가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
