const db = require("../config/db");

// 진도 저장 (있으면 업데이트, 없으면 생성) — ON DUPLICATE KEY UPDATE로 1쿼리 처리
exports.saveProgress = (req, res) => {
  const user_id = req.user?.id;
  const { lecture_id, watched_time, completed } = req.body;

  if (!user_id) return res.status(401).json({ message: "인증 필요" });

  const sql = `
    INSERT INTO progress (user_id, lecture_id, watched_time, completed)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE watched_time = VALUES(watched_time), completed = VALUES(completed)
  `;
  db.query(sql, [user_id, lecture_id, watched_time, completed ? 1 : 0], (err) => {
    if (err) return res.status(500).json(err);
    return res.json({ message: "진도 저장 완료", watched_time, completed });
  });
};

exports.getProgressByUser = (req, res) => {
  const { userId } = req.params;

  const sql = `
    SELECT p.*, l.title
    FROM progress p
    JOIN lectures l ON p.lecture_id = l.id
    WHERE p.user_id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};
