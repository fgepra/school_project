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

// 전체 강의 영상 목록 (관리자용)
exports.getAllLectures = (req, res) => {
  const sql = `
    SELECT l.id, l.title, l.video_url, l.is_hidden, l.hidden_by_admin,
           l.course_id, c.title AS course_title,
           u.id AS instructor_id, u.name AS instructor_name
    FROM lectures l
    JOIN courses c ON l.course_id = c.id
    JOIN users u ON c.instructor_id = u.id
    ORDER BY l.is_hidden DESC, l.id DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: '서버 오류' });
    res.json({ data: results });
  });
};

// 강의 영상 강제 비공개
exports.hideLecture = (req, res) => {
  const { lectureId } = req.params;
  db.query(
    'UPDATE lectures SET is_hidden = 1, hidden_by_admin = 1 WHERE id = ?',
    [lectureId],
    (err, result) => {
      if (err) return res.status(500).json({ message: '서버 오류' });
      if (result.affectedRows === 0) return res.status(404).json({ message: '강의를 찾을 수 없습니다.' });

      const notifySql = `
        SELECT c.instructor_id, l.title AS lecture_title
        FROM lectures l JOIN courses c ON l.course_id = c.id WHERE l.id = ?
      `;
      db.query(notifySql, [lectureId], (err, rows) => {
        if (!err && rows.length) {
          db.query(
            `INSERT INTO notifications (user_id, type, title, message, related_id, is_read, created_at)
             VALUES (?, 'system', '강의 영상 비공개 처리', ?, ?, 0, NOW())`,
            [rows[0].instructor_id, `"${rows[0].lecture_title}" 영상이 관리자에 의해 비공개 처리되었습니다. 수정 후 공개 요청을 해주세요.`, lectureId],
            () => {}
          );
        }
      });

      res.json({ message: '비공개 처리되었습니다.' });
    }
  );
};

// 강의 영상 공개 복구 (관리자 직접)
exports.unhideLecture = (req, res) => {
  const { lectureId } = req.params;
  db.query(
    'UPDATE lectures SET is_hidden = 0, hidden_by_admin = 0 WHERE id = ?',
    [lectureId],
    (err, result) => {
      if (err) return res.status(500).json({ message: '서버 오류' });
      if (result.affectedRows === 0) return res.status(404).json({ message: '강의를 찾을 수 없습니다.' });
      res.json({ message: '공개 처리되었습니다.' });
    }
  );
};

// 공개 요청 목록 조회
exports.getPublishRequests = (req, res) => {
  const sql = `
    SELECT pr.id, pr.lecture_id, pr.reason, pr.status, pr.admin_note, pr.created_at, pr.reviewed_at,
           l.title AS lecture_title, l.course_id,
           c.title AS course_title,
           u.name AS instructor_name
    FROM publish_requests pr
    JOIN lectures l ON pr.lecture_id = l.id
    JOIN courses c ON l.course_id = c.id
    JOIN users u ON pr.instructor_id = u.id
    ORDER BY FIELD(pr.status, 'pending', 'rejected', 'approved'), pr.created_at DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: '서버 오류' });
    res.json({ data: results });
  });
};

// 공개 요청 승인
exports.approvePublishRequest = (req, res) => {
  const { requestId } = req.params;
  const { admin_note } = req.body;

  db.query('SELECT lecture_id, instructor_id FROM publish_requests WHERE id = ? AND status = "pending"',
    [requestId], (err, rows) => {
      if (err || !rows.length) return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
      const { lecture_id, instructor_id } = rows[0];

      db.query('UPDATE publish_requests SET status = "approved", admin_note = ?, reviewed_at = NOW() WHERE id = ?',
        [admin_note || null, requestId], (err) => {
          if (err) return res.status(500).json({ message: '서버 오류' });

          db.query('UPDATE lectures SET is_hidden = 0, hidden_by_admin = 0 WHERE id = ?', [lecture_id], () => {});
          db.query(
            `INSERT INTO notifications (user_id, type, title, message, related_id, is_read, created_at)
             VALUES (?, 'system', '공개 요청 승인', '공개 요청이 승인되었습니다. 강의 영상이 다시 공개됩니다.', ?, 0, NOW())`,
            [instructor_id, lecture_id], () => {}
          );
          res.json({ message: '승인되었습니다.' });
        }
      );
    }
  );
};

// 공개 요청 거절
exports.rejectPublishRequest = (req, res) => {
  const { requestId } = req.params;
  const { admin_note } = req.body;

  db.query('SELECT instructor_id, lecture_id FROM publish_requests WHERE id = ? AND status = "pending"',
    [requestId], (err, rows) => {
      if (err || !rows.length) return res.status(404).json({ message: '요청을 찾을 수 없습니다.' });
      const { instructor_id, lecture_id } = rows[0];

      db.query('UPDATE publish_requests SET status = "rejected", admin_note = ?, reviewed_at = NOW() WHERE id = ?',
        [admin_note || null, requestId], (err) => {
          if (err) return res.status(500).json({ message: '서버 오류' });

          db.query(
            `INSERT INTO notifications (user_id, type, title, message, related_id, is_read, created_at)
             VALUES (?, 'system', '공개 요청 거절', ?, ?, 0, NOW())`,
            [instructor_id, `공개 요청이 거절되었습니다. 사유: ${admin_note || '없음'}`, lecture_id], () => {}
          );
          res.json({ message: '거절되었습니다.' });
        }
      );
    }
  );
};

// 강의(Course) 강제 비공개
exports.hideCourse = (req, res) => {
  const { courseId } = req.params;
  db.query(
    'UPDATE courses SET is_hidden = 1, hidden_by_admin = 1 WHERE id = ?',
    [courseId],
    (err, result) => {
      if (err) return res.status(500).json({ message: '서버 오류' });
      if (result.affectedRows === 0) return res.status(404).json({ message: '강의를 찾을 수 없습니다.' });

      const notifySql = `
        SELECT c.instructor_id, c.title AS course_title
        FROM courses c WHERE c.id = ?
      `;
      db.query(notifySql, [courseId], (err, rows) => {
        if (!err && rows.length) {
          db.query(
            `INSERT INTO notifications (user_id, type, title, message, related_id, is_read, created_at)
             VALUES (?, 'system', '강의 비공개 처리', ?, ?, 0, NOW())`,
            [rows[0].instructor_id, `"${rows[0].course_title}" 강의가 관리자에 의해 비공개 처리되었습니다.`, courseId],
            () => {}
          );
        }
      });

      res.json({ message: '비공개 처리되었습니다.' });
    }
  );
};

// 강의(Course) 공개 복구 (관리자)
exports.unhideCourse = (req, res) => {
  const { courseId } = req.params;
  db.query(
    'UPDATE courses SET is_hidden = 0, hidden_by_admin = 0 WHERE id = ?',
    [courseId],
    (err, result) => {
      if (err) return res.status(500).json({ message: '서버 오류' });
      if (result.affectedRows === 0) return res.status(404).json({ message: '강의를 찾을 수 없습니다.' });
      res.json({ message: '공개 처리되었습니다.' });
    }
  );
};
