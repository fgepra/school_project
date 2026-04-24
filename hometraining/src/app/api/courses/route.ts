// src/app/api/courses/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { query, insert } from '@/lib/db';
import { requireAuth } from '@/lib/auth';
import { Course } from '@/types';

// GET /api/courses - 강의 목록 조회
export async function GET() {
  try {
    const courses = await query<Course>(
      `SELECT 
        c.*,
        COUNT(l.id) AS lecture_count
       FROM courses c
       LEFT JOIN lectures l ON l.course_id = c.id
       GROUP BY c.id
       ORDER BY c.created_at DESC`
    );

    return NextResponse.json({ success: true, data: courses });
  } catch (error) {
    console.error('[courses GET error]', error);
    return NextResponse.json(
      { success: false, error: '강의 목록을 불러오지 못했습니다.' },
      { status: 500 }
    );
  }
}

// POST /api/courses - 강의 등록 (인증 필요)
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { title, description, difficulty, met_value } = await req.json();

    if (!title) {
      return NextResponse.json(
        { success: false, error: '강의 제목은 필수입니다.' },
        { status: 400 }
      );
    }

    const courseId = await insert(
      'INSERT INTO courses (title, description, difficulty, met_value) VALUES (?, ?, ?, ?)',
      [title, description ?? '', difficulty ?? 'beginner', met_value ?? 3.0]
    );

    return NextResponse.json(
      { success: true, data: { id: courseId }, message: '강의가 등록되었습니다.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[courses POST error]', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
