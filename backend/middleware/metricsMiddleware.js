// 메모리 내 메트릭 저장소
const metrics = {
  totalRequests: 0,
  errorCount: 0,
  responseTimes: [], // 최근 200개만 유지
  recentRequests: [], // 최근 50개 요청 로그
  startTime: Date.now(),
};

// 메트릭 미들웨어
function metricsMiddleware(req, res, next) {
  const start = Date.now();
  metrics.totalRequests += 1;

  res.on('finish', () => {
    const duration = Date.now() - start;
    metrics.responseTimes.push(duration);
    if (metrics.responseTimes.length > 200) metrics.responseTimes.shift();

    if (res.statusCode >= 400) metrics.errorCount += 1;

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
}

// 메트릭 통계 계산
function getStats() {
  const times = metrics.responseTimes;
  const avgResponseTime = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
  const errorRate = metrics.totalRequests > 0 ? ((metrics.errorCount / metrics.totalRequests) * 100).toFixed(2) : '0.00';

  return {
    totalRequests: metrics.totalRequests,
    errorCount: metrics.errorCount,
    errorRate: parseFloat(errorRate),
    avgResponseTime,
    uptimeSeconds: Math.floor((Date.now() - metrics.startTime) / 1000),
    recentRequests: metrics.recentRequests.slice(0, 20),
  };
}

module.exports = { metricsMiddleware, getStats };
