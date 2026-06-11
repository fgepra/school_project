const db = require('../config/db');

const logMiddleware = (req, res, next) => {
  const userId = req.user?.id ?? null;
  const action = `${req.method} ${req.path}`;
  const ip = req.headers['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || null;
  const detail = req.body && Object.keys(req.body).length
    ? JSON.stringify(req.body).substring(0, 500)
    : null;

  db.query(
    'INSERT INTO activity_logs (user_id, action, detail, ip_address) VALUES (?,?,?,?)',
    [userId, action, detail, ip],
    () => {}
  );

  next();
};

module.exports = logMiddleware;
