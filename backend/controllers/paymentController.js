const db = require('../config/db');

// 결제 처리 (시뮬레이션)
exports.processPayment = (req, res) => {
  const userId = req.user.id;
  const { course_id, payment_method, card_last4 } = req.body;

  if (!course_id) {
    return res.status(400).json({ success: false, message: '강의 ID가 필요합니다.' });
  }

  // 강의 존재 & 가격 확인
  db.query('SELECT id, title, price FROM courses WHERE id = ?', [course_id], (err, courses) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
    if (courses.length === 0) return res.status(404).json({ success: false, message: '강의를 찾을 수 없습니다.' });

    const course = courses[0];
    const amount = course.price || 0;

    // 이미 구매한 강의인지 확인
    db.query(
      "SELECT id FROM payments WHERE user_id = ? AND course_id = ? AND status = 'completed'",
      [userId, course_id],
      (err, existing) => {
        if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
        if (existing.length > 0) {
          return res.status(400).json({ success: false, message: '이미 구매한 강의입니다.' });
        }

        // 결제 저장
        const sql = `
          INSERT INTO payments (user_id, course_id, amount, status, payment_method, card_last4, created_at)
          VALUES (?, ?, ?, 'completed', ?, ?, NOW())
        `;
        db.query(sql, [userId, course_id, amount, payment_method || 'card', card_last4 || null], (err, result) => {
          if (err) return res.status(500).json({ success: false, message: 'DB 오류' });

          // 결제 완료 알림 생성
          const notifSql = `
            INSERT INTO notifications (user_id, type, title, message, is_read, related_id, created_at)
            VALUES (?, 'purchase', ?, ?, 0, ?, NOW())
          `;
          db.query(notifSql, [
            userId,
            '결제 완료',
            `"${course.title}" 강의 결제가 완료되었습니다. (₩${amount.toLocaleString()})`,
            result.insertId,
          ], () => {});

          res.status(201).json({
            success: true,
            message: '결제가 완료되었습니다.',
            data: { paymentId: result.insertId, amount, course_id, status: 'completed' },
          });
        });
      }
    );
  });
};

// 내 결제 내역
exports.getMyPayments = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT p.*, c.title AS course_title, c.price
    FROM payments p
    JOIN courses c ON p.course_id = c.id
    WHERE p.user_id = ?
    ORDER BY p.created_at DESC
  `;
  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
    res.json({ success: true, data: results });
  });
};

// 구매 여부 확인
exports.checkPurchase = (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.params;

  db.query(
    "SELECT id FROM payments WHERE user_id = ? AND course_id = ? AND status = 'completed'",
    [userId, courseId],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, data: { purchased: results.length > 0 } });
    }
  );
};

// 환불 처리
exports.refundPayment = (req, res) => {
  const userId = req.user.id;
  const isAdmin = req.user.role === 'admin';
  const { paymentId } = req.params;

  const checkSql = isAdmin
    ? "SELECT * FROM payments WHERE id = ? AND status = 'completed'"
    : "SELECT * FROM payments WHERE id = ? AND user_id = ? AND status = 'completed'";
  const checkParams = isAdmin ? [paymentId] : [paymentId, userId];

  db.query(checkSql, checkParams, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
    if (results.length === 0) {
      return res.status(404).json({ success: false, message: '결제 내역을 찾을 수 없거나 환불이 불가합니다.' });
    }

    db.query("UPDATE payments SET status = 'refunded' WHERE id = ?", [paymentId], (err) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, message: '환불이 완료되었습니다.' });
    });
  });
};

// 전체 결제 내역 (admin)
exports.getAllPayments = (req, res) => {
  const sql = `
    SELECT p.*, c.title AS course_title, u.name AS user_name, u.email AS user_email
    FROM payments p
    JOIN courses c ON p.course_id = c.id
    JOIN users u ON p.user_id = u.id
    ORDER BY p.created_at DESC
    LIMIT 500
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
    res.json({ success: true, data: results });
  });
};
