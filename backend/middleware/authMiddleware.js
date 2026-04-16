const jwt = require("jsonwebtoken");

// JWT 인증 미들웨어
module.exports = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) return res.status(403).json({ message: "토큰 없음" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, role, iat, exp }
    next();
  } catch {
    res.status(401).json({ message: "토큰 오류" });
  }
};
