const db = require('../config/db');
const { getStats } = require('../middleware/metricsMiddleware');

// 헬스체크
exports.healthCheck = (req, res) => {
  const memoryMB = process.memoryUsage();

  db.query('SELECT 1', (err) => {
    const dbStatus = err ? 'error' : 'ok';
    res.json({
      success: true,
      data: {
        status: 'ok',
        db: dbStatus,
        uptime: process.uptime(),
        memory: {
          rss: Math.round(memoryMB.rss / 1024 / 1024),
          heapUsed: Math.round(memoryMB.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memoryMB.heapTotal / 1024 / 1024),
        },
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
      },
    });
  });
};

// API 통계 (admin)
exports.getMonitorStats = (req, res) => {
  const stats = getStats();
  res.json({ success: true, data: stats });
};
