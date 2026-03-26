// src/app/api/courses/[id]/lectures/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { Lecture } from '@/types';

// GET /api/courses/:courseId/lectures - 강의 영상 목록 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const courseId = Number(params.id);

    if (isNaN(courseId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 강의 ID입니다.' },
        { status: 400 }
      );
    }

    const lectures = await query<Lecture>(
      'SELECT * FROM lectures WHERE course_id = ? ORDER BY id ASC',
      [courseId]
    );

    return NextResponse.json({ success: true, data: lectures });
  } catch (error) {
    console.error('[lectures list error]', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
