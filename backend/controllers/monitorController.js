const db = require('../config/db');
const { getMetrics } = require('../middleware/metricsMiddleware');

exports.health = (req, res) => {
  db.query('SELECT 1', (err) => {
    const dbStatus = err ? 'disconnected' : 'connected';
    const mem = process.memoryUsage();
    res.json({
      success: true,
      data: {
        status: dbStatus === 'connected' ? 'ok' : 'degraded',
        db: dbStatus,
        uptime: Math.floor(process.uptime()),
        nodeVersion: process.version,
        memory: {
          rss: mem.rss,
          heapUsed: mem.heapUsed,
          heapTotal: mem.heapTotal,
        },
        timestamp: new Date().toISOString(),
      },
    });
  });
};

exports.getStats = (req, res) => {
  res.json({ success: true, data: getMetrics() });
};
