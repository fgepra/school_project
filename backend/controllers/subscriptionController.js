const db = require('../config/db');
const { sendMail, templates } = require('../utils/mailer');

exports.getMySubscriptions = (req, res) => {
  const userId = req.user.id;
  db.query(
    'SELECT * FROM subscriptions WHERE user_id = ?',
    [userId],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, data: results });
    }
  );
};

exports.updateSubscription = (req, res) => {
  const userId = req.user.id;
  const { type, is_active } = req.body;
  const validTypes = ['weekly_digest', 'course_update', 'promotion'];

  if (!validTypes.includes(type)) {
    return res.status(400).json({ success: false, message: '유효하지 않은 구독 유형입니다.' });
  }

  db.query(
    `INSERT INTO subscriptions (user_id, type, is_active) VALUES (?,?,?)
     ON DUPLICATE KEY UPDATE is_active = ?`,
    [userId, type, is_active ? 1 : 0, is_active ? 1 : 0],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, message: `구독 설정이 ${is_active ? '활성화' : '비활성화'}되었습니다.` });
    }
  );
};

exports.sendWeeklyDigest = async (req, res) => {
  db.query(
    `SELECT u.id, u.name, u.email
     FROM users u
     JOIN subscriptions s ON u.id = s.user_id
     WHERE s.type = 'weekly_digest' AND s.is_active = 1`,
    async (err, users) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });

      let sent = 0;
      for (const user of users) {
        try {
          await sendMail({
            to: user.email,
            subject: '[HOMEFIT] 이번 주 추천 강의',
            html: `<h2>${user.name}님, 안녕하세요!</h2><p>이번 주 HOMEFIT 추천 강의를 확인해보세요.</p>`,
          });
          sent++;
        } catch {}
      }

      res.json({ success: true, message: `${sent}명에게 주간 다이제스트를 발송했습니다.` });
    }
  );
};
