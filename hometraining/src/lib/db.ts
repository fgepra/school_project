// src/lib/db.ts
// MySQL 연결 풀 관리 - mysql2/promise 사용

import mysql from 'mysql2/promise';

// 연결 풀 (싱글톤)
let pool: mysql.Pool | null = null;

export function getPool(): mysql.Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'hometraining',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

// 쿼리 실행 헬퍼
export async function query<T = unknown>(
  sql: string,
  values?: unknown[]
): Promise<T[]> {
  const pool = getPool();
  const [rows] = await pool.execute(sql, values);
  return rows as T[];
}

// 단건 조회 헬퍼
export async function queryOne<T = unknown>(
  sql: string,
  values?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(sql, values);
  return rows[0] ?? null;
}

// INSERT 헬퍼 - insertId 반환
export async function insert(
  sql: string,
  values?: unknown[]
): Promise<number> {
  const pool = getPool();
  const [result] = await pool.execute(sql, values);
  return (result as mysql.ResultSetHeader).insertId;
}
