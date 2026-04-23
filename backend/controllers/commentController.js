const db = require("../config/db");

// 특정 강의의 댓글 + 답글 조회
exports.getComments = (req, res) => {
  const { lectureId } = req.params;

  const sql = `
    SELECT
      c.id, c.user_id, c.lecture_id, c.content, c.created_at,
      u.name AS user_name, u.role AS user_role
    FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.lecture_id = ?
    ORDER BY c.created_at ASC
  `;

  db.query(sql, [lectureId], (err, comments) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });

    if (comments.length === 0) return res.json([]);

    // 각 댓글의 답글 조회
    const commentIds = comments.map(c => c.id);
    const replySql = `
      SELECT
        r.id, r.comment_id, r.user_id, r.content, r.created_at,
        u.name AS user_name, u.role AS user_role
      FROM replies r
      JOIN users u ON r.user_id = u.id
      WHERE r.comment_id IN (?)
      ORDER BY r.created_at ASC
    `;

    db.query(replySql, [commentIds], (err, replies) => {
      if (err) return res.status(500).json({ message: "서버 오류", error: err });

      // 댓글에 답글 매핑
      const result = comments.map(comment => ({
        ...comment,
        replies: replies.filter(r => r.comment_id === comment.id),
      }));

      res.json(result);
    });
  });
};

// 댓글 작성 (학생/강사/관리자 모두 가능)
exports.createComment = (req, res) => {
  const { lectureId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "댓글 내용을 입력해주세요." });
  }

  const sql = "INSERT INTO comments (user_id, lecture_id, content, created_at) VALUES (?, ?, ?, NOW())";
  db.query(sql, [userId, lectureId, content.trim()], (err, result) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });

    // 생성된 댓글 조회하여 반환
    const selectSql = `
      SELECT c.*, u.name AS user_name, u.role AS user_role
      FROM comments c JOIN users u ON c.user_id = u.id
      WHERE c.id = ?
    `;
    db.query(selectSql, [result.insertId], (err, rows) => {
      if (err) return res.status(500).json({ message: "서버 오류", error: err });
      res.status(201).json({ ...rows[0], replies: [] });
    });
  });
};

// 댓글 삭제 (작성자 본인 또는 관리자만 가능)
exports.deleteComment = (req, res) => {
  const { commentId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const checkSql = isAdmin
    ? "SELECT id FROM comments WHERE id = ?"
    : "SELECT id FROM comments WHERE id = ? AND user_id = ?";
  const checkParams = isAdmin ? [commentId] : [commentId, userId];

  db.query(checkSql, checkParams, (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    if (results.length === 0) {
      return res.status(403).json({ message: "삭제 권한이 없습니다." });
    }

    db.query("DELETE FROM comments WHERE id = ?", [commentId], (err) => {
      if (err) return res.status(500).json({ message: "서버 오류", error: err });
      res.json({ message: "댓글이 삭제되었습니다." });
    });
  });
};

// 답글 작성 (강사/관리자만 가능)
exports.createReply = (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "답글 내용을 입력해주세요." });
  }

  // 댓글 존재 여부 확인
  db.query("SELECT id FROM comments WHERE id = ?", [commentId], (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    if (results.length === 0) {
      return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
    }

    const sql = "INSERT INTO replies (comment_id, user_id, content, created_at) VALUES (?, ?, ?, NOW())";
    db.query(sql, [commentId, userId, content.trim()], (err, result) => {
      if (err) return res.status(500).json({ message: "서버 오류", error: err });

      const selectSql = `
        SELECT r.*, u.name AS user_name, u.role AS user_role
        FROM replies r JOIN users u ON r.user_id = u.id
        WHERE r.id = ?
      `;
      db.query(selectSql, [result.insertId], (err, rows) => {
        if (err) return res.status(500).json({ message: "서버 오류", error: err });
        res.status(201).json(rows[0]);
      });
    });
  });
};

// 댓글 수정 (본인만 가능)
exports.updateComment = (req, res) => {
  const { commentId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: "댓글 내용을 입력해주세요." });
  }

  // 본인 댓글만 수정 가능 (관리자도 수정 불가)
  db.query("SELECT id FROM comments WHERE id = ? AND user_id = ?", [commentId, userId], (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    if (results.length === 0) {
      return res.status(403).json({ message: "수정 권한이 없습니다." });
    }

    db.query("UPDATE comments SET content = ? WHERE id = ?", [content.trim(), commentId], (err) => {
      if (err) return res.status(500).json({ message: "서버 오류", error: err });

      const selectSql = `
        SELECT c.*, u.name AS user_name, u.role AS user_role
        FROM comments c JOIN users u ON c.user_id = u.id
        WHERE c.id = ?
      `;
      db.query(selectSql, [commentId], (err, rows) => {
        if (err) return res.status(500).json({ message: "서버 오류", error: err });
        res.json(rows[0]);
      });
    });
  });
};

// 답글 삭제 (작성자 본인 또는 관리자만 가능)
exports.deleteReply = (req, res) => {
  const { replyId } = req.params;
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';

  const checkSql = isAdmin
    ? "SELECT id FROM replies WHERE id = ?"
    : "SELECT id FROM replies WHERE id = ? AND user_id = ?";
  const checkParams = isAdmin ? [replyId] : [replyId, userId];

  db.query(checkSql, checkParams, (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    if (results.length === 0) {
      return res.status(403).json({ message: "삭제 권한이 없습니다." });
    }

    db.query("DELETE FROM replies WHERE id = ?", [replyId], (err) => {
      if (err) return res.status(500).json({ message: "서버 오류", error: err });
      res.json({ message: "답글이 삭제되었습니다." });
    });
  });
};
