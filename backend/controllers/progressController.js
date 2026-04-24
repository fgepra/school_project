const db = require("../config/db");

// 진도 저장 (있으면 업데이트, 없으면 생성)
exports.saveProgress = (req, res) => {
  const { user_id, lecture_id, progress } = req.body;

  const checkSql =
    "SELECT * FROM progress WHERE user_id = ? AND lecture_id = ?";

  db.query(checkSql, [user_id, lecture_id], (err, results) => {
    if (err) return res.status(500).json(err);

    // 이미 있으면 UPDATE
    if (results.length > 0) {
      const updateSql =
        "UPDATE progress SET progress = ? WHERE user_id = ? AND lecture_id = ?";
      db.query(updateSql, [progress, user_id, lecture_id], (err) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "진도 업데이트 완료" });
      });
    } else {
      // 없으면 INSERT
      const insertSql =
        "INSERT INTO progress (user_id, lecture_id, progress) VALUES (?, ?, ?)";
      db.query(insertSql, [user_id, lecture_id, progress], (err, result) => {
        if (err) return res.status(500).json(err);
        return res.json({ message: "진도 저장 완료" });
      });
    }
  });
};

// 🔥 유저 진도 조회
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