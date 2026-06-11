const db = require('../config/db');

exports.getLogs = (req, res) => {
  const { action, user_id, limit = 200 } = req.query;
  const conditions = [];
  const params = [];

  if (action) { conditions.push('action LIKE ?'); params.push(`%${action}%`); }
  if (user_id) { conditions.push('user_id = ?'); params.push(user_id); }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const safeLimit = Math.min(parseInt(limit, 10) || 200, 1000);

  db.query(
    `SELECT * FROM activity_logs ${where} ORDER BY created_at DESC LIMIT ?`,
    [...params, safeLimit],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, data: results });
    }
  );
};

exports.deleteOldLogs = (req, res) => {
  db.query(
    'DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)',
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, message: '오래된 로그가 삭제되었습니다.', data: { deleted: result.affectedRows } });
    }
  );
};
