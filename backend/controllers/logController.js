const db = require('../config/db');

// 최근 로그 200개 (admin)
exports.getLogs = (req, res) => {
  const { action, user_id } = req.query;
  let sql = `
    SELECT l.*, u.name AS user_name
    FROM activity_logs l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE 1=1
  `;
  const params = [];

  if (action) { sql += ' AND l.action LIKE ?'; params.push(`%${action}%`); }
  if (user_id) { sql += ' AND l.user_id = ?'; params.push(user_id); }

  sql += ' ORDER BY l.created_at DESC LIMIT 200';

  db.query(sql, params, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
    res.json({ success: true, data: results });
  });
};

// 30일 이상 된 로그 삭제 (admin)
exports.deleteOldLogs = (req, res) => {
  db.query(
    "DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)",
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, message: `${result.affectedRows}개의 오래된 로그가 삭제되었습니다.`, data: { deleted: result.affectedRows } });
    }
  );
};
