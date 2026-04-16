// 역할 기반 접근 제어 미들웨어
// authMiddleware 이후에 사용해야 함 (req.user가 있어야 함)

// 특정 역할만 허용
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(403).json({ message: "인증이 필요합니다." });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: "접근 권한이 없습니다." });
  }
  next();
};

// 관리자만 허용
const requireAdmin = requireRole('admin');

// 강사 또는 관리자 허용
const requireInstructor = requireRole('instructor', 'admin');

module.exports = { requireRole, requireAdmin, requireInstructor };
