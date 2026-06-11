const db = require('../config/db');
const { createNotification } = require('./notificationController');
const { alerts } = require('../utils/discord');

exports.processPayment = (req, res) => {
  const userId = req.user.id;
  const { courseId, amount, paymentMethod, cardLast4 } = req.body;

  db.query(
    'SELECT id, title, price FROM courses WHERE id = ?',
    [courseId],
    (err, courses) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      if (!courses.length) return res.status(404).json({ success: false, message: '강의를 찾을 수 없습니다.' });

      const course = courses[0];
      if (course.price > 0 && Number(course.price) !== Number(amount)) {
        return res.status(400).json({ success: false, message: '결제 금액이 일치하지 않습니다.' });
      }

      db.query(
        'SELECT id FROM payments WHERE user_id = ? AND course_id = ? AND status != "refunded"',
        [userId, courseId],
        (err, existing) => {
          if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
          if (existing.length) return res.status(409).json({ success: false, message: '이미 구매한 강의입니다.' });

          db.query(
            'INSERT INTO payments (user_id, course_id, amount, status, payment_method, card_last4) VALUES (?,?,?,?,?,?)',
            [userId, courseId, amount, 'completed', paymentMethod, cardLast4],
            (err, result) => {
              if (err) return res.status(500).json({ success: false, message: 'DB 오류' });

              createNotification(
                userId,
                'payment',
                '결제 완료',
                `${course.title} 강의가 결제되었습니다.`,
                courseId
              );

              db.query('SELECT name FROM users WHERE id = ?', [userId], (_, users) => {
                const userName = users?.[0]?.name || '사용자';
                alerts.newPurchase(userName, course.title, amount).catch(() => {});
              });

              res.json({
                success: true,
                message: '결제가 완료되었습니다.',
                data: { paymentId: result.insertId, amount, course_id: courseId, status: 'completed' },
              });
            }
          );
        }
      );
    }
  );
};

exports.getMyPayments = (req, res) => {
  const userId = req.user.id;
  db.query(
    `SELECT p.*, c.title AS course_title, c.difficulty
     FROM payments p
     JOIN courses c ON p.course_id = c.id
     WHERE p.user_id = ?
     ORDER BY p.created_at DESC`,
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, data: results });
    }
  );
};

exports.checkPurchase = (req, res) => {
  const userId = req.user.id;
  const { courseId } = req.params;
  db.query(
    'SELECT id FROM payments WHERE user_id = ? AND course_id = ? AND status = "completed"',
    [userId, courseId],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, data: { purchased: results.length > 0 } });
    }
  );
};

exports.refund = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  db.query(
    'SELECT p.*, c.title AS course_title FROM payments p JOIN courses c ON p.course_id = c.id WHERE p.id = ? AND p.user_id = ?',
    [id, userId],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      if (!results.length) return res.status(404).json({ success: false, message: '결제 내역을 찾을 수 없습니다.' });

      const payment = results[0];
      if (payment.status !== 'completed') {
        return res.status(400).json({ success: false, message: '환불 가능한 결제가 아닙니다.' });
      }

      db.query(
        'UPDATE payments SET status = "refunded" WHERE id = ?',
        [id],
        (err) => {
          if (err) return res.status(500).json({ success: false, message: 'DB 오류' });

          createNotification(userId, 'payment', '환불 완료', `${payment.course_title} 강의가 환불되었습니다.`, payment.course_id);
          alerts.refund('사용자', payment.course_title, payment.amount).catch(() => {});

          res.json({ success: true, message: '환불이 완료되었습니다.' });
        }
      );
    }
  );
};

exports.getAllPayments = (req, res) => {
  db.query(
    `SELECT p.*, u.name AS user_name, u.email, c.title AS course_title
     FROM payments p
     JOIN users u ON p.user_id = u.id
     JOIN courses c ON p.course_id = c.id
     ORDER BY p.created_at DESC
     LIMIT 200`,
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, data: results });
    }
  );
};
