const db = require("../config/db");

// 진도 저장 (있으면 UPDATE, 없으면 INSERT)
exports.saveProgress = (req, res) => {
  const userId = req.user?.id;
  const { lecture_id, watched_time = 0, completed = false } = req.body;

  if (!userId || !lecture_id) {
    return res.status(400).json({ message: "lecture_id가 필요합니다." });
  }

  const checkSql = "SELECT id FROM progress WHERE user_id = ? AND lecture_id = ?";
  db.query(checkSql, [userId, lecture_id], (err, results) => {
    if (err) return res.status(500).json({ message: "DB 오류", error: err });

    if (results.length > 0) {
      const updateSql = `
        UPDATE progress
        SET watched_time = ?, completed = ?, updated_at = NOW()
        WHERE user_id = ? AND lecture_id = ?
      `;
      db.query(updateSql, [watched_time, completed ? 1 : 0, userId, lecture_id], (err) => {
        if (err) return res.status(500).json({ message: "DB 오류", error: err });
        res.json({ message: "진도 업데이트 완료", lecture_id, watched_time, completed });
      });
    } else {
      const insertSql = `
        INSERT INTO progress (user_id, lecture_id, watched_time, completed)
        VALUES (?, ?, ?, ?)
      `;
      db.query(insertSql, [userId, lecture_id, watched_time, completed ? 1 : 0], (err) => {
        if (err) return res.status(500).json({ message: "DB 오류", error: err });
        res.json({ message: "진도 저장 완료", lecture_id, watched_time, completed });
      });
    }
  });
};

// 유저 진도 조회
exports.getProgressByUser = (req, res) => {
  const userId = req.user?.id || req.params.userId;

  const sql = `
    SELECT p.id, p.user_id, p.lecture_id, p.watched_time, p.completed, p.updated_at, l.title
    FROM progress p
    JOIN lectures l ON p.lecture_id = l.id
    WHERE p.user_id = ?
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "DB 오류", error: err });
    res.json(results);
  });
};
