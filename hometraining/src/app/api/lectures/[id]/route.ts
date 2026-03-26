// src/app/api/lectures/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { Lecture } from '@/types';

// GET /api/lectures/:id - 개별 강의 영상 조회
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lectureId = Number(params.id);

    if (isNaN(lectureId)) {
      return NextResponse.json(
        { success: false, error: '유효하지 않은 강의 ID입니다.' },
        { status: 400 }
      );
    }

    const lecture = await queryOne<Lecture>(
      'SELECT * FROM lectures WHERE id = ?',
      [lectureId]
    );

    if (!lecture) {
      return NextResponse.json(
        { success: false, error: '강의 영상을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: lecture });
  } catch (error) {
    console.error('[lecture GET error]', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
