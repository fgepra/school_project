const db = require("../config/db");

exports.getCourses = (req, res) => {
  const sql = `
    SELECT c.*, u.name AS instructor_name
    FROM courses c
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE c.is_hidden = 0
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};

exports.getCourseById = (req, res) => {
  const { id } = req.params;
  const sql = `
    SELECT c.*, u.name AS instructor_name
    FROM courses c
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE c.id = ?
  `;
  db.query(sql, [id], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0) return res.status(404).json({ message: "강의를 찾을 수 없습니다." });
    res.json(results[0]);
  });
};