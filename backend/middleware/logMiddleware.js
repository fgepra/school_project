const db = require('../config/db');
const logger = require('../utils/logger');

module.exports = (req, res, next) => {
  const start = Date.now();
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || null;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const userId = req.user ? req.user.id : null;
    const action = `${req.method} ${req.path}`;
    const detail = JSON.stringify({ status: res.statusCode, duration, query: req.query, body: req.method !== 'GET' ? req.body : undefined });

    logger.info(`${action} ${res.statusCode} ${duration}ms uid=${userId || 'guest'}`);

    // DB에 activity_logs 저장 (에러는 무시)
    const sql = 'INSERT INTO activity_logs (user_id, action, detail, ip_address, created_at) VALUES (?, ?, ?, ?, NOW())';
    db.query(sql, [userId, action, detail, ip], () => {});
  });

  next();
};
