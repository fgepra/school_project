const db = require("../config/db");

exports.getLectures = (req, res) => {
  const { courseId } = req.params;

  const sql = "SELECT * FROM lectures WHERE course_id = ?";
  db.query(sql, [courseId], (err, results) => {
    if (err) return res.status(500).json(err);
    res.json(results);
  });
};