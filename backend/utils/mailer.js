const nodemailer = require('nodemailer');
const logger = require('./logger');

const transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

const sendMail = async ({ to, subject, html, text }) => {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    logger.warn('이메일 환경변수 미설정 — 실제 발송 건너뜀', { to, subject });
    return { skipped: true };
  }
  try {
    const info = await transporter.sendMail({
      from: `"HOMEFIT" <${process.env.MAIL_USER}>`,
      to,
      subject,
      html,
      text,
    });
    logger.info('이메일 발송 완료', { to, subject, messageId: info.messageId });
    return info;
  } catch (err) {
    logger.error('이메일 발송 실패', { to, subject, error: err.message });
    throw err;
  }
};

const templates = {
  welcome: (name) => ({
    subject: `[HOMEFIT] ${name}님, 환영합니다!`,
    html: `<h2>안녕하세요 ${name}님</h2><p>HOMEFIT에 오신 것을 환영합니다. 지금 바로 운동을 시작해보세요!</p>`,
  }),
  paymentComplete: (name, courseTitle, amount) => ({
    subject: `[HOMEFIT] 결제 완료 — ${courseTitle}`,
    html: `<h2>결제가 완료되었습니다</h2><p>${name}님, <strong>${courseTitle}</strong> 강의 결제(₩${amount.toLocaleString()})가 완료되었습니다.</p>`,
  }),
  progressReminder: (name, courseTitle, rate) => ({
    subject: `[HOMEFIT] ${courseTitle} 수강을 계속해보세요!`,
    html: `<h2>${name}님, 수강이 ${rate}% 남았어요!</h2><p><strong>${courseTitle}</strong>를 완료하고 운동 목표를 달성해보세요.</p>`,
  }),
};

module.exports = { sendMail, templates };
