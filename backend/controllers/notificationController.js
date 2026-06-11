const db = require('../config/db');

const createNotification = (userId, type, title, message, relatedId = null) => {
  db.query(
    'INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?,?,?,?,?)',
    [userId, type, title, message, relatedId],
    () => {}
  );
};

exports.createNotification = createNotification;

exports.getAll = (req, res) => {
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

exports.markAsRead = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  db.query(
    'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
    [id, userId],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, message: '읽음 처리 완료' });
    }
  );
};

exports.markAllAsRead = (req, res) => {
  const userId = req.user.id;
  db.query(
    'UPDATE notifications SET is_read = 1 WHERE user_id = ?',
    [userId],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, message: '전체 읽음 처리 완료' });
    }
  );
};

exports.deleteNotification = (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  db.query(
    'DELETE FROM notifications WHERE id = ? AND user_id = ?',
    [id, userId],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, message: '알림 삭제 완료' });
    }
  );
};
