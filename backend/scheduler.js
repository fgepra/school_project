const cron = require('node-cron');
const db = require('./config/db');
const logger = require('./utils/logger');
const { sendMail } = require('./utils/mailer');
const { alerts } = require('./utils/discord');

function registerScheduler() {
  // 매일 새벽 2시 — 30일 이상 오래된 로그 자동 삭제
  cron.schedule('0 2 * * *', () => {
    db.query(
      'DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)',
      (err, result) => {
        if (err) return logger.error('로그 자동 삭제 실패', { error: err.message });
        logger.info(`로그 자동 삭제 완료: ${result.affectedRows}건`);
      }
    );
  });

  // 매월 1일 자정 — 전월 정산 자동 생성
  cron.schedule('0 0 1 * *', () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const period = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

    const { generateSettlements } = require('./controllers/settlementController');
    generateSettlements(period, null, (err, count) => {
      if (err) return logger.error('월간 정산 자동 생성 실패', { error: err.message });
      logger.info(`월간 정산 자동 생성 완료: ${period}, ${count}건`);
      alerts.sendDiscordAlert(`📊 ${period} 월간 정산 ${count}건 자동 생성 완료`).catch(() => {});
    });
  });

  // 매주 월요일 오전 9시 — 진도 50% 미만 학생에게 독려 알림
  cron.schedule('0 9 * * 1', () => {
    const sql = `
      SELECT u.id AS user_id, u.name, u.email, c.title AS course_title,
             ROUND(completed_count / total_count * 100) AS rate
      FROM users u
      JOIN (
        SELECT p.user_id, l.course_id,
               COUNT(*) AS total_count,
               SUM(p.completed) AS completed_count
        FROM progress p
        JOIN lectures l ON p.lecture_id = l.id
        GROUP BY p.user_id, l.course_id
        HAVING total_count > 0 AND completed_count / total_count < 0.5
      ) prog ON u.id = prog.user_id
      JOIN courses c ON prog.course_id = c.id
      WHERE u.role = 'student'
      LIMIT 200
    `;
    db.query(sql, async (err, rows) => {
      if (err) return logger.error('진도 독려 알림 조회 실패', { error: err.message });

      for (const row of rows) {
        db.query(
          'INSERT INTO notifications (user_id, type, title, message, related_id) VALUES (?,?,?,?,?)',
          [row.user_id, 'progress', '수강을 계속해보세요!', `${row.course_title} 강의가 ${row.rate}% 남았습니다.`, null],
          () => {}
        );

        // 이메일 구독자에게 실제 이메일 발송
        db.query(
          "SELECT id FROM subscriptions WHERE user_id = ? AND type = 'weekly_digest' AND is_active = 1",
          [row.user_id],
          async (_, subs) => {
            if (subs?.length) {
              try {
                await sendMail({
                  to: row.email,
                  subject: `[HOMEFIT] ${row.course_title} 수강을 계속해보세요!`,
                  html: `<h2>${row.name}님, 안녕하세요!</h2><p><strong>${row.course_title}</strong> 강의가 ${row.rate}% 남았어요. 지금 바로 계속해보세요!</p>`,
                });
              } catch {}
            }
          }
        );
      }

      logger.info(`진도 독려 알림 발송 완료: ${rows.length}명`);
    });
  });

  // 매일 오전 8시 — 디스코드 일일 통계 보고
  cron.schedule('0 8 * * *', () => {
    db.query(
      `SELECT
         COUNT(*) AS total_payments,
         COALESCE(SUM(amount), 0) AS total_revenue
       FROM payments
       WHERE DATE(created_at) = DATE(DATE_SUB(NOW(), INTERVAL 1 DAY))
         AND status = 'completed'`,
      (err, result) => {
        if (err || !result.length) return;
        const { total_payments, total_revenue } = result[0];
        if (total_payments > 0) {
          alerts.sendDiscordAlert(
            `📈 **어제의 통계**: 결제 ${total_payments}건, 매출 ₩${Number(total_revenue).toLocaleString()}`
          ).catch(() => {});
        }
      }
    );
  });

  logger.info('스케줄러 등록 완료');
}

module.exports = { registerScheduler };
