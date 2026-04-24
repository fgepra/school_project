const db = require('../config/db');

// 강사 본인 정산 내역
exports.getInstructorSettlement = (req, res) => {
  const instructorId = req.user.id;

  const sql = `
    SELECT s.*, c.title AS course_title
    FROM settlements s
    JOIN courses c ON s.course_id = c.id
    WHERE s.instructor_id = ?
    ORDER BY s.period DESC, s.created_at DESC
  `;
  db.query(sql, [instructorId], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
    res.json({ success: true, data: results });
  });
};

// 관리자 전체 정산 내역
exports.getAdminSettlement = (req, res) => {
  const sql = `
    SELECT s.*, c.title AS course_title, u.name AS instructor_name
    FROM settlements s
    JOIN courses c ON s.course_id = c.id
    JOIN users u ON s.instructor_id = u.id
    ORDER BY s.period DESC, s.created_at DESC
    LIMIT 500
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
    res.json({ success: true, data: results });
  });
};

// 기간별 매출 통계 (admin)
exports.getAdminStats = (req, res) => {
  const { type = 'monthly' } = req.query;

  let groupFormat;
  if (type === 'daily') groupFormat = '%Y-%m-%d';
  else if (type === 'weekly') groupFormat = '%x-W%v';
  else groupFormat = '%Y-%m';

  const sql = `
    SELECT
      DATE_FORMAT(p.created_at, ?) AS period,
      COUNT(*) AS payment_count,
      SUM(p.amount) AS total_revenue,
      COUNT(DISTINCT p.user_id) AS unique_buyers
    FROM payments p
    WHERE p.status = 'completed'
    GROUP BY period
    ORDER BY period DESC
    LIMIT 24
  `;
  db.query(sql, [groupFormat], (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 오류' });

    // 전체 합계
    const totalRevenue = results.reduce((sum, r) => sum + (r.total_revenue || 0), 0);
    const totalPayments = results.reduce((sum, r) => sum + (r.payment_count || 0), 0);

    res.json({ success: true, data: { stats: results, totalRevenue, totalPayments } });
  });
};

// 정산 생성 (admin — 지정 월의 정산 자동 계산)
exports.generateSettlement = (req, res) => {
  const { period } = req.body; // 'YYYY-MM'
  if (!period) return res.status(400).json({ success: false, message: 'period(YYYY-MM) 필요' });

  const [year, month] = period.split('-');
  const startDate = `${year}-${month}-01`;
  const endDate = new Date(year, month, 0).toISOString().slice(0, 10); // 해당 월 마지막 날

  // 해당 기간의 completed 결제를 강사/강의별로 집계
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
    if (err) return res.status(500).json({ success: false, message: 'DB 오류' });
    if (rows.length === 0) return res.json({ success: true, message: '정산할 데이터가 없습니다.', data: [] });

    const payoutRate = 0.70;
    let completed = 0;

    rows.forEach((row) => {
      const payoutAmount = Math.floor(row.revenue * payoutRate);
      const insertSql = `
        INSERT INTO settlements (instructor_id, course_id, period, revenue, payout_rate, payout_amount, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())
        ON DUPLICATE KEY UPDATE revenue = VALUES(revenue), payout_amount = VALUES(payout_amount)
      `;
      db.query(insertSql, [row.instructor_id, row.course_id, period, row.revenue, payoutRate, payoutAmount], (err) => {
        if (!err) completed++;
      });
    });

    setTimeout(() => {
      res.json({ success: true, message: `${period} 정산 생성 완료 (${rows.length}건)`, data: rows });
    }, 200);
  });
};

// CSV 내보내기 (admin)
exports.exportSettlementCSV = (req, res) => {
  const sql = `
    SELECT s.period, u.name AS instructor_name, c.title AS course_title,
           s.revenue, s.payout_rate, s.payout_amount, s.status, s.created_at
    FROM settlements s
    JOIN courses c ON s.course_id = c.id
    JOIN users u ON s.instructor_id = u.id
    ORDER BY s.period DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ success: false, message: 'DB 오류' });

    const header = ['기간', '강사명', '강의명', '매출', '정산율', '정산금액', '상태', '생성일'];
    const rows = results.map(r => [
      r.period, r.instructor_name, r.course_title,
      r.revenue, r.payout_rate, r.payout_amount,
      r.status, new Date(r.created_at).toLocaleDateString('ko-KR'),
    ]);
    const csv = [header, ...rows].map(row => row.join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=settlement_${Date.now()}.csv`);
    res.send('\uFEFF' + csv); // BOM for Excel
  });
};
