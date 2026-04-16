const db = require("../config/db");

// 전체 유저 목록 조회 (관리자 전용)
exports.getUsers = (req, res) => {
  const sql = `
    SELECT id, email, name, weight, role, created_at
    FROM users
    ORDER BY created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    res.json(results);
  });
};

// 유저 역할 변경 (관리자 전용)
exports.updateUserRole = (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  const allowedRoles = ['student', 'instructor', 'admin'];
  if (!allowedRoles.includes(role)) {
    return res.status(400).json({ message: "유효하지 않은 역할입니다." });
  }

  // 자기 자신의 역할 변경 방지
  if (Number(userId) === req.user.id) {
    return res.status(400).json({ message: "자신의 역할은 변경할 수 없습니다." });
  }

  const sql = "UPDATE users SET role = ? WHERE id = ?";
  db.query(sql, [role, userId], (err, result) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "유저를 찾을 수 없습니다." });
    }
    res.json({ message: "역할이 변경되었습니다." });
  });
};

// 통계 조회 (관리자 전용)
exports.getStats = (req, res) => {
  const queries = [
    "SELECT COUNT(*) AS total FROM users",
    "SELECT role, COUNT(*) AS count FROM users GROUP BY role",
    "SELECT COUNT(*) AS total FROM courses",
    "SELECT COUNT(*) AS total FROM lectures",
    "SELECT COUNT(*) AS total FROM progress WHERE completed = 1",
  ];

  Promise.all(queries.map(sql => new Promise((resolve, reject) => {
    db.query(sql, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  })))
    .then(([totalUsers, roleStats, totalCourses, totalLectures, completedProgress]) => {
      res.json({
        totalUsers: totalUsers[0].total,
        roleStats,
        totalCourses: totalCourses[0].total,
        totalLectures: totalLectures[0].total,
        completedProgress: completedProgress[0].total,
      });
    })
    .catch(err => res.status(500).json({ message: "서버 오류", error: err }));
};
