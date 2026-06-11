const db = require('../config/db');

exports.getInstructorSettlement = (req, res) => {
  const instructorId = req.user.id;
  db.query(
    `SELECT s.*, c.title AS course_title
     FROM settlements s
     JOIN courses c ON s.course_id = c.id
     WHERE s.instructor_id = ?
     ORDER BY s.period DESC, s.created_at DESC`,
    [instructorId],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, data: results });
    }
  );
};

exports.getInstructorMonthlyStats = (req, res) => {
  const instructorId = req.user.id;
  db.query(
    `SELECT
       DATE_FORMAT(p.created_at, '%Y-%m') AS month,
       COUNT(p.id) AS sales_count,
       SUM(p.amount) AS total_revenue,
       ROUND(SUM(p.amount) * 0.7) AS payout_amount
     FROM payments p
     JOIN courses c ON p.course_id = c.id
     WHERE c.instructor_id = ? AND p.status = 'completed'
     GROUP BY month
     ORDER BY month DESC
     LIMIT 12`,
    [instructorId],
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, data: results });
    }
  );
};

exports.requestSettlement = (req, res) => {
  const instructorId = req.user.id;
  const { period } = req.body;
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return res.status(400).json({ success: false, message: 'YYYY-MM 형식으로 입력해주세요.' });
  }
  generateSettlements(period, instructorId, (err, count) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
    res.json({ success: true, message: `${count}건의 정산이 생성되었습니다.` });
  });
};

exports.getAdminSettlement = (req, res) => {
  db.query(
    `SELECT s.*, u.name AS instructor_name, c.title AS course_title
     FROM settlements s
     JOIN users u ON s.instructor_id = u.id
     JOIN courses c ON s.course_id = c.id
     ORDER BY s.period DESC, s.created_at DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      res.json({ success: true, data: results });
    }
  );
};

exports.getAdminStats = (req, res) => {
  const type = req.query.type || 'monthly';
  const formatMap = { daily: '%Y-%m-%d', weekly: '%Y-%u', monthly: '%Y-%m' };
  const fmt = formatMap[type] || '%Y-%m';

  db.query(
    `SELECT
       DATE_FORMAT(created_at, ?) AS period,
       COUNT(*) AS payment_count,
       SUM(amount) AS total_revenue,
       COUNT(DISTINCT user_id) AS unique_buyers
     FROM payments
     WHERE status = 'completed'
     GROUP BY period
     ORDER BY period DESC
     LIMIT 30`,
    [fmt],
    (err, stats) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      db.query(
        "SELECT SUM(amount) AS total, COUNT(*) AS count FROM payments WHERE status = 'completed'",
        (err2, totals) => {
          if (err2) return res.status(500).json({ success: false, message: 'DB 오류' });
          res.json({
            success: true,
            data: {
              stats,
              totalRevenue: totals[0].total || 0,
              totalPayments: totals[0].count || 0,
            },
          });
        }
      );
    }
  );
};

exports.generateSettlement = (req, res) => {
  const { period } = req.body;
  if (!period || !/^\d{4}-\d{2}$/.test(period)) {
    return res.status(400).json({ success: false, message: 'YYYY-MM 형식으로 입력해주세요.' });
  }
  generateSettlements(period, null, (err, count) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
    res.json({ success: true, message: `${count}건의 정산이 생성되었습니다.` });
  });
};

exports.exportCSV = (req, res) => {
  db.query(
    `SELECT s.period, u.name AS instructor_name, c.title AS course_title,
            s.revenue, s.payout_rate, s.payout_amount, s.status, s.created_at
     FROM settlements s
     JOIN users u ON s.instructor_id = u.id
     JOIN courses c ON s.course_id = c.id
     ORDER BY s.period DESC`,
    (err, results) => {
      if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
      const header = '기간,강사명,강의명,매출,정산비율,정산액,상태,생성일\n';
      const rows = results.map(r =>
        `${r.period},"${r.instructor_name}","${r.course_title}",${r.revenue},${r.payout_rate},${r.payout_amount},${r.status},${r.created_at}`
      ).join('\n');
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="settlements.csv"');
      res.send('﻿' + header + rows);
    }
  );
};

function generateSettlements(period, instructorId, callback) {
  const whereClause = instructorId
    ? `WHERE DATE_FORMAT(p.created_at, '%Y-%m') = ? AND p.status = 'completed' AND c.instructor_id = ?`
    : `WHERE DATE_FORMAT(p.created_at, '%Y-%m') = ? AND p.status = 'completed'`;
  const params = instructorId ? [period, instructorId] : [period];

  db.query(
    `SELECT p.course_id, c.instructor_id, SUM(p.amount) AS revenue
     FROM payments p
     JOIN courses c ON p.course_id = c.id
     ${whereClause}
     GROUP BY p.course_id, c.instructor_id`,
    params,
    (err, rows) => {
      if (err) return callback(err);
      if (!rows.length) return callback(null, 0);

      let completed = 0;
      rows.forEach(row => {
        const payoutAmount = Math.round(row.revenue * 0.7);
        db.query(
          `INSERT INTO settlements (instructor_id, course_id, period, revenue, payout_rate, payout_amount, status)
           VALUES (?,?,?,?,0.70,?,'pending')
           ON DUPLICATE KEY UPDATE revenue = VALUES(revenue), payout_amount = VALUES(payout_amount)`,
          [row.instructor_id, row.course_id, period, row.revenue, payoutAmount],
          () => { completed++; if (completed === rows.length) callback(null, completed); }
        );
      });
    }
  );
}

exports.generateSettlements = generateSettlements;
