const db = require('../config/db');

// 내 알림 목록
exports.getMyNotifications = (req, res) => {
  const userId = req.user.id;

  db.query(
    'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 100',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, data: results });
    }
  );
};

// 미읽음 수
exports.getUnreadCount = (req, res) => {
  const userId = req.user.id;

  db.query(
    'SELECT COUNT(*) AS count FROM notifications WHERE user_id = ? AND is_read = 0',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, data: { count: results[0].count } });
    }
  );
};

// 개별 읽음 처리
exports.markAsRead = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  db.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [id, userId],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, message: '읽음 처리되었습니다.' });
    }
  );
};

// 전체 읽음 처리
exports.markAllAsRead = (req, res) => {
  const userId = req.user.id;

  db.query(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
    [userId],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, message: '전체 읽음 처리되었습니다.' });
    }
  );
};

// 알림 삭제
exports.deleteNotification = (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;

  db.query(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [id, userId],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, message: '알림이 삭제되었습니다.' });
    }
  );
};

// 알림 생성 헬퍼 (다른 컨트롤러에서 require해서 사용)
exports.createNotification = (userId, type, title, message, relatedId = null) => {
  const sql = `
    INSERT INTO notifications (user_id, type, title, message, is_read, related_id, created_at)
    VALUES (?, ?, ?, ?, 0, ?, NOW())
  `;
  db.query(sql, [userId, type, title, message, relatedId], () => {});
};
