// src/app/api/progress/[userId]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Progress } from '@/types';

// GET /api/progress/:userId - 사용자 진도 조회
export async function GET(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const user = requireAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const userId = Number(params.userId);

    // 본인 진도만 조회 가능
    if (user.userId !== userId) {
      return NextResponse.json(
        { success: false, error: '접근 권한이 없습니다.' },
        { status: 403 }
      );
    }

    const progress = await query<Progress>(
      `SELECT 
        p.*,
        l.title AS lecture_title,
        l.duration
       FROM progress p
       JOIN lectures l ON l.id = p.lecture_id
       WHERE p.user_id = ?`,
      [userId]
    );

    return NextResponse.json({ success: true, data: progress });
  } catch (error) {
    console.error('[progress GET error]', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
