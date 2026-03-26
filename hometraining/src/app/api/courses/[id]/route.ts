// src/app/api/courses/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { Course } from '@/types';

// GET /api/courses/:id - 강의 상세 조회
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

    const course = await queryOne<Course>(
      `SELECT 
        c.*,
        COUNT(l.id) AS lecture_count
       FROM courses c
       LEFT JOIN lectures l ON l.course_id = c.id
       WHERE c.id = ?
       GROUP BY c.id`,
      [courseId]
    );

    if (!course) {
      return NextResponse.json(
        { success: false, error: '강의를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: course });
  } catch (error) {
    console.error('[course GET error]', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
