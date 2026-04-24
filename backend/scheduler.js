const cron = require('node-cron');
const db = require('./config/db');
const logger = require('./utils/logger');

// 매일 자정: 30일 이상 된 로그 자동 삭제
cron.schedule('0 0 * * *', () => {
  logger.info('[Scheduler] 오래된 로그 삭제 시작');
  db.query("DELETE FROM activity_logs WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)", (err, result) => {
    if (err) {
      logger.error('[Scheduler] 로그 삭제 실패: ' + err.message);
    } else {
      logger.info(`[Scheduler] 로그 삭제 완료: ${result.affectedRows}건`);
    }
  });
});

// 매월 1일 오전 1시: 지난달 정산 자동 생성
cron.schedule('0 1 1 * *', () => {
  const now = new Date();
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const period = `${lastMonth.getFullYear()}-${String(lastMonth.getMonth() + 1).padStart(2, '0')}`;

  logger.info(`[Scheduler] ${period} 정산 자동 생성 시작`);

  const startDate = `${period}-01`;
  const endDay = new Date(lastMonth.getFullYear(), lastMonth.getMonth() + 1, 0).getDate();
  const endDate = `${period}-${String(endDay).padStart(2, '0')}`;

  const sql = `
    SELECT p.course_id, c.instructor_id, SUM(p.amount) AS revenue
    FROM payments p
    JOIN courses c ON p.course_id = c.id
    WHERE p.status = 'completed'
      AND DATE(p.created_at) >= ?
      AND DATE(p.created_at) <= ?
      AND c.instructor_id IS NOT NULL
    GROUP BY p.course_id, c.instructor_id
  `;

  db.query(sql, [startDate, endDate], (err, rows) => {
    if (err) return logger.error('[Scheduler] 정산 집계 실패: ' + err.message);

    rows.forEach((row) => {
      const payoutAmount = Math.floor(row.revenue * 0.70);
      const insertSql = `
        INSERT INTO settlements (instructor_id, course_id, period, revenue, payout_rate, payout_amount, status, created_at)
        VALUES (?, ?, ?, ?, 0.70, ?, 'pending', NOW())
        ON DUPLICATE KEY UPDATE revenue = VALUES(revenue), payout_amount = VALUES(payout_amount)
      `;
      db.query(insertSql, [row.instructor_id, row.course_id, period, row.revenue, payoutAmount], (err) => {
        if (err) logger.error('[Scheduler] 정산 저장 실패: ' + err.message);
      });
    });

    logger.info(`[Scheduler] ${period} 정산 생성 완료: ${rows.length}건`);
  });
});

// 매주 월요일 오전 9시: 진도 미완료 알림 생성
cron.schedule('0 9 * * 1', () => {
  logger.info('[Scheduler] 진도 미완료 알림 생성 시작');

  // 수강 중이지만 7일 이상 접속 안 한 유저 조회
  const sql = `
    SELECT DISTINCT p.user_id, p.course_id, c.title AS course_title
    FROM progress p
    JOIN courses c ON p.course_id = c.id
    WHERE p.completed = 0
      AND p.updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY)
  `;

  db.query(sql, (err, rows) => {
    if (err) return logger.error('[Scheduler] 진도 조회 실패: ' + err.message);

    rows.forEach((row) => {
      const notifSql = `
        INSERT INTO notifications (user_id, type, title, message, is_read, related_id, created_at)
        VALUES (?, 'system', '강의 진도 알림', ?, 0, ?, NOW())
      `;
      db.query(notifSql, [
        row.user_id,
        `"${row.course_title}" 강의를 완료하지 않으셨습니다. 계속 학습해보세요!`,
        row.course_id,
      ], () => {});
    });

    logger.info(`[Scheduler] 진도 알림 생성 완료: ${rows.length}건`);
  });
});

logger.info('[Scheduler] 스케줄러 시작됨');
