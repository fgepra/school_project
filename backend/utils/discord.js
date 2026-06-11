const logger = require('./logger');

const sendDiscordAlert = async (content, embeds) => {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const body = { content };
  if (embeds) body.embeds = embeds;

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`Discord webhook HTTP ${res.status}`);
  } catch (err) {
    logger.warn('Discord 알림 전송 실패', { error: err.message });
  }
};

const alerts = {
  newPurchase: (userName, courseTitle, amount) =>
    sendDiscordAlert(`🎓 **신규 결제**: ${userName} → ${courseTitle} (₩${amount.toLocaleString()})`),

  refund: (userName, courseTitle, amount) =>
    sendDiscordAlert(`↩️ **환불 요청**: ${userName} → ${courseTitle} (₩${amount.toLocaleString()})`),

  serverError: (path, message) =>
    sendDiscordAlert(`⚠️ **서버 에러**: \`${path}\` — ${message}`),

  highErrorRate: (rate) =>
    sendDiscordAlert(`🚨 **에러율 급증**: 현재 에러율 **${rate}%**`),

  dailyStats: (stats) =>
    sendDiscordAlert(
      `📊 **오늘의 통계** (${new Date().toLocaleDateString('ko-KR')})`,
      [{
        color: 0x5865f2,
        fields: [
          { name: '총 요청', value: String(stats.totalRequests), inline: true },
          { name: '에러 수', value: String(stats.errorCount), inline: true },
          { name: '평균 응답시간', value: `${stats.avgResponseTime}ms`, inline: true },
        ],
      }]
    ),
};

module.exports = { sendDiscordAlert, alerts };
