// src/app/api/auth/signup/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { query, insert } from '@/lib/db';
import { hashPassword, signToken } from '@/lib/auth';
import { User, SignupRequest } from '@/types';

export async function POST(req: NextRequest) {
  try {
    const body: SignupRequest = await req.json();
    const { email, password, name, weight } = body;

    // 입력값 검증
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, error: '이메일, 비밀번호, 이름은 필수입니다.' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: '비밀번호는 6자 이상이어야 합니다.' },
        { status: 400 }
      );
    }

    // 이메일 중복 확인
    const existing = await query<User>(
      'SELECT id FROM users WHERE email = ?',
      [email]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: '이미 사용 중인 이메일입니다.' },
        { status: 409 }
      );
    }

    // 비밀번호 해시
    const hashedPassword = await hashPassword(password);

    // DB에 사용자 저장
    const userId = await insert(
      'INSERT INTO users (email, password, name, weight) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, weight ?? null]
    );

    // JWT 발급
    const token = signToken({ userId, email });

    return NextResponse.json(
      {
        success: true,
        data: {
          token,
          user: { id: userId, email, name, weight: weight ?? null },
        },
        message: '회원가입이 완료되었습니다.',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[signup error]', error);
    return NextResponse.json(
      { success: false, error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
