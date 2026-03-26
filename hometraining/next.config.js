/** @type {import('next').NextConfig} */
const nextConfig = {
  // 서버 컴포넌트에서 mysql2 등 Node.js 전용 모듈 사용을 위한 설정
  serverExternalPackages: ['mysql2'],
};

module.exports = nextConfig;
