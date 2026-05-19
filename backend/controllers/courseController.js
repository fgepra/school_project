const db = require("../config/db");

exports.getCourses = (req, res) => {
  db.query("SELECT * FROM courses", (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

exports.getCourseById = (req, res) => {
  const { id } = req.params;
  db.query("SELECT * FROM courses WHERE id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ message: "DB 오류", error: err });
    if (!results || results.length === 0)
      return res.status(404).json({ message: "강의를 찾을 수 없습니다." });
    res.json(results[0]);
  });
};