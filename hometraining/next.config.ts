import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 서버 컴포넌트에서 mysql2 등 Node.js 전용 모듈 사용을 위한 설정
  serverExternalPackages: ['mysql2', 'bcryptjs', 'jsonwebtoken'],
  // MediaPipe WebAssembly 지원
  webpack: (config) => {
    config.experiments = { ...config.experiments, asyncWebAssembly: true };
    return config;
  },
};

export default nextConfig;
