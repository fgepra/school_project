const db = require("../config/db");

// ─── 강의(Course) 관리 ─────────────────────────────────────────

// 내 강의 목록 조회
exports.getMyCourses = (req, res) => {
  const instructorId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  // 관리자는 전체 강의 조회 가능
  const sql = isAdmin
    ? `SELECT c.*, u.name AS instructor_name,
         (SELECT COUNT(*) FROM lectures l WHERE l.course_id = c.id) AS lecture_count
       FROM courses c
       LEFT JOIN users u ON c.instructor_id = u.id
       ORDER BY c.created_at DESC`
    : `SELECT c.*, u.name AS instructor_name,
         (SELECT COUNT(*) FROM lectures l WHERE l.course_id = c.id) AS lecture_count
       FROM courses c
       LEFT JOIN users u ON c.instructor_id = u.id
       WHERE c.instructor_id = ?
       ORDER BY c.created_at DESC`;

  const params = isAdmin ? [] : [instructorId];

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    res.json(results);
  });
};

// 강의 생성
exports.createCourse = (req, res) => {
  const { title, description, difficulty, met_value } = req.body;
  const instructorId = req.user.id;

  if (!title || !description || !difficulty) {
    return res.status(400).json({ message: "제목, 설명, 난이도는 필수입니다." });
  }

  const allowedDifficulties = ['beginner', 'intermediate', 'advanced'];
  if (!allowedDifficulties.includes(difficulty)) {
    return res.status(400).json({ message: "유효하지 않은 난이도입니다." });
  }

  // 업로드된 이미지가 있으면 경로를 DB에 저장, 없으면 null
  const thumbnailPath = req.file ? `/uploads/thumbnails/${req.file.filename}` : null;

  const sql = `
    INSERT INTO courses (title, description, difficulty, met_value, thumbnail, instructor_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW())
  `;
  db.query(sql, [title, description, difficulty, met_value || 3.0, thumbnailPath, instructorId], (err, result) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    res.status(201).json({ message: "강의가 생성되었습니다.", courseId: result.insertId });
  });
};

// 강의 수정
exports.updateCourse = (req, res) => {
  const { courseId } = req.params;
  const { title, description, difficulty, met_value } = req.body;
  const instructorId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  // 권한 확인: 본인의 강의이거나 관리자인 경우만 수정 가능
  const checkSql = isAdmin
    ? "SELECT id, thumbnail FROM courses WHERE id = ?"
    : "SELECT id, thumbnail FROM courses WHERE id = ? AND instructor_id = ?";
  const checkParams = isAdmin ? [courseId] : [courseId, instructorId];

  db.query(checkSql, checkParams, (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    if (results.length === 0) {
      return res.status(403).json({ message: "해당 강의에 대한 권한이 없습니다." });
    }

    // 새 이미지가 업로드됐으면 새 경로, 아니면 기존 썸네일 유지
    const thumbnailPath = req.file
      ? `/uploads/thumbnails/${req.file.filename}`
      : results[0].thumbnail;

    const sql = `
      UPDATE courses SET title = ?, description = ?, difficulty = ?, met_value = ?, thumbnail = ?
      WHERE id = ?
    `;
    db.query(sql, [title, description, difficulty, met_value, thumbnailPath, courseId], (err) => {
      if (err) return res.status(500).json({ message: "서버 오류", error: err });
      res.json({ message: "강의가 수정되었습니다." });
    });
  });
};

// 강의 삭제
exports.deleteCourse = (req, res) => {
  const { courseId } = req.params;
  const instructorId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const checkSql = isAdmin
    ? "SELECT id FROM courses WHERE id = ?"
    : "SELECT id FROM courses WHERE id = ? AND instructor_id = ?";
  const checkParams = isAdmin ? [courseId] : [courseId, instructorId];

  db.query(checkSql, checkParams, (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    if (results.length === 0) {
      return res.status(403).json({ message: "해당 강의에 대한 권한이 없습니다." });
    }

    db.query("DELETE FROM courses WHERE id = ?", [courseId], (err) => {
      if (err) return res.status(500).json({ message: "서버 오류", error: err });
      res.json({ message: "강의가 삭제되었습니다." });
    });
  });
};

// ─── 강의 영상(Lecture) 관리 ──────────────────────────────────

// 특정 코스의 강의 영상 목록 조회
exports.getCourseLectures = (req, res) => {
  const { courseId } = req.params;
  const sql = "SELECT * FROM lectures WHERE course_id = ? ORDER BY order_num ASC, id ASC";
  db.query(sql, [courseId], (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    res.json(results);
  });
};

// 강의 영상 추가
exports.createLecture = (req, res) => {
  const { courseId } = req.params;
  const { title, video_url, duration, order_num } = req.body;
  const instructorId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!title) {
    return res.status(400).json({ message: "강의 제목은 필수입니다." });
  }

  // 해당 코스가 본인 것인지 확인
  const checkSql = isAdmin
    ? "SELECT id FROM courses WHERE id = ?"
    : "SELECT id FROM courses WHERE id = ? AND instructor_id = ?";
  const checkParams = isAdmin ? [courseId] : [courseId, instructorId];

  db.query(checkSql, checkParams, (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    if (results.length === 0) {
      return res.status(403).json({ message: "해당 강의에 대한 권한이 없습니다." });
    }

    const sql = "INSERT INTO lectures (course_id, title, video_url, duration, order_num) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [courseId, title, video_url || '', duration || 0, order_num || 0], (err, result) => {
      if (err) return res.status(500).json({ message: "서버 오류", error: err });
      res.status(201).json({ message: "강의 영상이 추가되었습니다.", lectureId: result.insertId });
    });
  });
};

// 강의 영상 수정
exports.updateLecture = (req, res) => {
  const { lectureId } = req.params;
  const { title, video_url, duration, order_num } = req.body;
  const instructorId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  // 강의 영상이 본인 코스에 속하는지 확인
  const checkSql = isAdmin
    ? "SELECT l.id FROM lectures l JOIN courses c ON l.course_id = c.id WHERE l.id = ?"
    : "SELECT l.id FROM lectures l JOIN courses c ON l.course_id = c.id WHERE l.id = ? AND c.instructor_id = ?";
  const checkParams = isAdmin ? [lectureId] : [lectureId, instructorId];

  db.query(checkSql, checkParams, (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    if (results.length === 0) {
      return res.status(403).json({ message: "해당 강의 영상에 대한 권한이 없습니다." });
    }

    const sql = "UPDATE lectures SET title = ?, video_url = ?, duration = ?, order_num = ? WHERE id = ?";
    db.query(sql, [title, video_url, duration, order_num, lectureId], (err) => {
      if (err) return res.status(500).json({ message: "서버 오류", error: err });
      res.json({ message: "강의 영상이 수정되었습니다." });
    });
  });
};

// 강의 영상 삭제
exports.deleteLecture = (req, res) => {
  const { lectureId } = req.params;
  const instructorId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const checkSql = isAdmin
    ? "SELECT l.id FROM lectures l JOIN courses c ON l.course_id = c.id WHERE l.id = ?"
    : "SELECT l.id FROM lectures l JOIN courses c ON l.course_id = c.id WHERE l.id = ? AND c.instructor_id = ?";
  const checkParams = isAdmin ? [lectureId] : [lectureId, instructorId];

  db.query(checkSql, checkParams, (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    if (results.length === 0) {
      return res.status(403).json({ message: "해당 강의 영상에 대한 권한이 없습니다." });
    }

    db.query("DELETE FROM lectures WHERE id = ?", [lectureId], (err) => {
      if (err) return res.status(500).json({ message: "서버 오류", error: err });
      res.json({ message: "강의 영상이 삭제되었습니다." });
    });
  });
};
