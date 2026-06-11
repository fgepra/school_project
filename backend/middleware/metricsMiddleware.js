const metrics = {
  totalRequests: 0,
  errorCount: 0,
  responseTimes: [],
  recentRequests: [],
  startTime: Date.now(),
};

const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  metrics.totalRequests++;

  res.on('finish', () => {
    const duration = Date.now() - start;

    metrics.responseTimes.push(duration);
    if (metrics.responseTimes.length > 100) metrics.responseTimes.shift();

    if (res.statusCode >= 400) metrics.errorCount++;

    metrics.recentRequests.unshift({
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    });
    if (metrics.recentRequests.length > 50) metrics.recentRequests.pop();
  });

  next();
};

const getMetrics = () => {
  const times = metrics.responseTimes;
  const avg = times.length
    ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
    : 0;
  const errorRate = metrics.totalRequests
    ? ((metrics.errorCount / metrics.totalRequests) * 100).toFixed(2)
    : '0.00';

  return {
    totalRequests: metrics.totalRequests,
    errorCount: metrics.errorCount,
    errorRate: parseFloat(errorRate),
    avgResponseTime: avg,
    uptimeSeconds: Math.floor((Date.now() - metrics.startTime) / 1000),
    recentRequests: metrics.recentRequests,
  };
};

module.exports = { metricsMiddleware, getMetrics };
