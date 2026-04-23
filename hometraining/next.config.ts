import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 서버 컴포넌트에서 mysql2 등 Node.js 전용 모듈 사용을 위한 설정
  serverExternalPackages: ['mysql2', 'bcryptjs', 'jsonwebtoken'],
  // Turbopack 설정 (Next.js 16 기본값)
  // MediaPipe는 CDN에서 로드하므로 별도 WASM 번들 설정 불필요
  turbopack: {},
};

export default nextConfig;
