// src/lib/auth.ts
// JWT 토큰 생성 / 검증 유틸리티

import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { JwtPayload } from '@/types';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = '7d';

// ─── 비밀번호 ───────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(
  plain: string,
  hashed: string
): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

// ─── JWT ────────────────────────────────────────────────────

export function signToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload;
}

// ─── Request에서 사용자 추출 ─────────────────────────────────

export function getUserFromRequest(req: NextRequest): JwtPayload | null {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.slice(7);
    return verifyToken(token);
  } catch {
    return null;
  }
}

// 인증 필요 API에서 사용하는 헬퍼 - 미인증 시 null 반환
export function requireAuth(req: NextRequest): JwtPayload | null {
  return getUserFromRequest(req);
}
