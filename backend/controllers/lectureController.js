const db = require("../config/db");

exports.getLectures = (req, res) => {
  const { courseId } = req.params;

  const sql = "SELECT * FROM lectures WHERE course_id = ?";
  db.query(sql, [courseId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

// 강의 ID로 단건 조회
exports.getLectureById = (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM lectures WHERE id = ?";
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(404).json({ message: "강의를 찾을 수 없습니다." });
    res.json(results[0]);
  });
};