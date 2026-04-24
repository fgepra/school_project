// src/app/api/progress/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { query, insert } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Progress, ProgressSaveRequest } from '@/types';

// POST /api/progress - 진도 저장 (upsert)
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const body: ProgressSaveRequest = await req.json();
    const { lecture_id, completed, watched_time } = body;

    if (!lecture_id) {
      return NextResponse.json(
        { success: false, error: 'lecture_id는 필수입니다.' },
        { status: 400 }
      );
    }

    // 기존 진도 확인
    const existing = await query<Progress>(
      'SELECT id FROM progress WHERE user_id = ? AND lecture_id = ?',
      [user.userId, lecture_id]
    );

    if (existing.length > 0) {
      // 업데이트
      await query(
        'UPDATE progress SET completed = ?, watched_time = ? WHERE user_id = ? AND lecture_id = ?',
        [completed, watched_time, user.userId, lecture_id]
      );
    } else {
      // 신규 저장
      await insert(
        'INSERT INTO progress (user_id, lecture_id, completed, watched_time) VALUES (?, ?, ?, ?)',
        [user.userId, lecture_id, completed, watched_time]
      );
    }

    return NextResponse.json({
      success: true,
      message: '진도가 저장되었습니다.',
    });
  } catch (error) {
    console.error('[progress POST error]', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
