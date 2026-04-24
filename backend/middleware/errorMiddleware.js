const logger = require('../utils/logger');

// 중앙 에러 핸들러 (app.js 마지막에 등록)
// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
  const status = err.status || 500;
  const message = err.message || '서버 내부 오류';

  logger.error(`${req.method} ${req.path} → ${status}: ${message}\n${err.stack || ''}`);

  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {}),
  });
};
