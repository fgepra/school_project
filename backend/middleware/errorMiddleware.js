const logger = require('../utils/logger');
const { alerts } = require('../utils/discord');

const errorMiddleware = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || '서버 오류가 발생했습니다.';

  logger.error(`${req.method} ${req.path} — ${message}`, {
    status,
    stack: err.stack,
    userId: req.user?.id,
    body: req.body,
  });

  if (status >= 500) {
    alerts.serverError(req.path, message).catch(() => {});
  }

  res.status(status).json({ success: false, message });
};

module.exports = errorMiddleware;
