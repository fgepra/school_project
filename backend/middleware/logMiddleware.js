const db = require('../config/db');

const logMiddleware = (req, res, next) => {
  res.on('finish', () => {
    const userId = req.user?.id ?? null;
    const action = `${req.method} ${req.path}`;

    db.query(
      'INSERT INTO activity_logs (user_id, action) VALUES (?, ?)',
      [userId, action],
      () => {}
    );
  });

  next();
};

module.exports = logMiddleware;
