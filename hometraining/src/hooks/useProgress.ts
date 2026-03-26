// src/hooks/useProgress.ts
'use client';

import { useState, useEffect, useCallback } from 'react';
import { progressApi } from '@/lib/api';
import { Progress } from '@/types';

export function useProgress(userId: number | null) {
  const [progressList, setProgressList] = useState<Progress[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    progressApi
      .getByUser(userId)
      .then(setProgressList)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [userId]);

  // 특정 강의의 진도 반환
  const getProgress = useCallback(
    (lectureId: number): Progress | undefined =>
      progressList.find((p) => p.lecture_id === lectureId),
    [progressList]
  );

  // 진도 저장
  const saveProgress = useCallback(
    async (lectureId: number, watchedTime: number, completed: boolean) => {
      await progressApi.save({
        lecture_id: lectureId,
        watched_time: watchedTime,
        completed,
      });

      // 로컬 상태 업데이트
      setProgressList((prev) => {
        const exists = prev.find((p) => p.lecture_id === lectureId);
        if (exists) {
          return prev.map((p) =>
            p.lecture_id === lectureId
              ? { ...p, watched_time: watchedTime, completed }
              : p
          );
        }
        return [
          ...prev,
          {
            id: Date.now(),
            user_id: userId!,
            lecture_id: lectureId,
            watched_time: watchedTime,
            completed,
          },
        ];
      });
    },
    [userId]
  );

  // 완료율 계산 (0~100)
  const getCompletionRate = useCallback(
    (lectureIds: number[]): number => {
      if (lectureIds.length === 0) return 0;
      const completed = lectureIds.filter((id) =>
        progressList.some((p) => p.lecture_id === id && p.completed)
      ).length;
      return Math.round((completed / lectureIds.length) * 100);
    },
    [progressList]
  );

  return { progressList, isLoading, getProgress, saveProgress, getCompletionRate };
}
