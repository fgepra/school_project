// backend/controllers/bookmarkController.js

// bookmarks 테이블 스키마:
// CREATE TABLE bookmarks (
//   id INT AUTO_INCREMENT PRIMARY KEY,
//   user_id INT NOT NULL,
//   course_id INT NOT NULL,
//   created_at DATETIME NOT NULL DEFAULT NOW(),
//   UNIQUE KEY unique_bookmark (user_id, course_id),
//   FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
//   FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
// );

const db = require("../config/db");

// POST /api/bookmarks/:courseId — 북마크 토글 (추가/삭제)
const toggleBookmark = (req, res) => {
  const userId = req.user.id;
  const courseId = Number(req.params.courseId);

  const checkSql = "SELECT id FROM bookmarks WHERE user_id = ? AND course_id = ?";
  db.query(checkSql, [userId, courseId], (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });

    if (results.length > 0) {
      // 이미 북마크 존재 → 삭제
      const deleteSql = "DELETE FROM bookmarks WHERE user_id = ? AND course_id = ?";
      db.query(deleteSql, [userId, courseId], (err2) => {
        if (err2) return res.status(500).json({ message: "서버 오류", error: err2 });
        return res.json({ bookmarked: false, message: "즐겨찾기가 해제되었습니다." });
      });
    } else {
      // 북마크 없음 → 추가
      const insertSql = "INSERT INTO bookmarks (user_id, course_id) VALUES (?, ?)";
      db.query(insertSql, [userId, courseId], (err2) => {
        if (err2) return res.status(500).json({ message: "서버 오류", error: err2 });
        return res.json({ bookmarked: true, message: "즐겨찾기에 추가되었습니다." });
      });
    }
  });
};

// GET /api/bookmarks — 내 북마크 목록 조회
const getMyBookmarks = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT b.id AS bookmark_id, c.*, u.name AS instructor_name,
      (SELECT COUNT(*) FROM lectures l WHERE l.course_id = c.id) AS lecture_count
    FROM bookmarks b
    JOIN courses c ON b.course_id = c.id
    LEFT JOIN users u ON c.instructor_id = u.id
    WHERE b.user_id = ?
    ORDER BY b.created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    return res.json(results);
  });
};

// GET /api/bookmarks/:courseId — 특정 강의 북마크 여부 확인
const checkBookmark = (req, res) => {
  const userId = req.user.id;
  const courseId = Number(req.params.courseId);

  const sql = "SELECT id FROM bookmarks WHERE user_id = ? AND course_id = ?";
  db.query(sql, [userId, courseId], (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    return res.json({ bookmarked: results.length > 0 });
  });
};

module.exports = { toggleBookmark, getMyBookmarks, checkBookmark };
