// src/app/(main)/workout/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { workoutApi } from '@/lib/api';
import { WorkoutRecord, WorkoutDayStat } from '@/types';

export default function WorkoutPage() {
  const [records, setRecords] = useState<WorkoutRecord[]>([]);
  const [stats, setStats] = useState<WorkoutDayStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([workoutApi.getAll(), workoutApi.getStats()])
      .then(([recs, st]) => {
        setRecords(recs);
        setStats(st);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const totalSessions = stats.reduce((sum, s) => sum + s.total_sessions, 0);
  const totalCalories = stats.reduce((sum, s) => sum + s.total_calories, 0);
  const totalDurationSec = stats.reduce((sum, s) => sum + s.total_duration_sec, 0);
  const totalDurationMin = Math.round(totalDurationSec / 60);

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* 헤더 */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 26, fontWeight: 700 }}>운동 기록</h1>
        <p style={{ color: 'var(--text-secondary)', marginTop: 6, fontSize: 14 }}>
          나의 운동 히스토리를 확인하세요.
        </p>
      </div>

      {/* 통계 카드 3개 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 16,
          marginBottom: 40,
        }}
      >
        {[
          { icon: '🏋️', label: '총 운동 횟수', value: `${totalSessions}회` },
          { icon: '🔥', label: '총 소모 칼로리', value: `${totalCalories}kcal` },
          { icon: '⏱️', label: '총 운동 시간', value: `${totalDurationMin}분` },
        ].map((stat) => (
          <div key={stat.label} className="card" style={{ padding: 24 }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>{stat.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 700 }}>{stat.value}</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* 운동 기록 목록 */}
      <div>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>운동 기록 목록</h2>

        {records.length === 0 ? (
          <div
            className="card"
            style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}
          >
            아직 운동 기록이 없습니다.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {records.map((record) => (
              <div
                key={record.id}
                className="card"
                style={{
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>
                    {record.lecture_title ?? '운동 기록'}
                  </div>
                  {record.course_title && (
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4 }}>
                      {record.course_title}
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
                    {new Date(record.recorded_at).toLocaleDateString('ko-KR')}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20, flexShrink: 0 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>
                      {Math.round(record.duration_sec / 60)}분
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>운동 시간</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>
                      {record.calories_burned}kcal
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>소모 칼로리</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
