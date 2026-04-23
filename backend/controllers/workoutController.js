const db = require("../config/db");

// 기존 테이블 스키마:
// workout_records (id, user_id, lecture_id, exercise_time, calories_burned, date)
// FK: user_id → users.id, lecture_id → lectures.id

// POST /api/workout - 운동 기록 저장
exports.saveWorkout = (req, res) => {
  const userId = req.user.id;
  const { lecture_id, course_id, duration_sec } = req.body;

  // duration_sec → exercise_time 으로 매핑
  const exerciseTime = duration_sec || 0;

  if (exerciseTime <= 0) {
    return res.status(400).json({ message: "운동 시간을 입력해주세요." });
  }

  // 사용자 체중 + 강의 코스 MET 값 조회
  db.query("SELECT weight FROM users WHERE id = ?", [userId], (err, userResults) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });

    const weight = (userResults[0]?.weight) ? userResults[0].weight : 70;

    // lecture_id로 course 조회 → met_value 가져오기
    const metSql = lecture_id
      ? "SELECT c.met_value FROM lectures l JOIN courses c ON l.course_id = c.id WHERE l.id = ?"
      : course_id
        ? "SELECT met_value FROM courses WHERE id = ?"
        : null;
    const metParam = lecture_id || course_id || null;

    const insertRecord = (met) => {
      const calories_burned = Math.round(met * weight * (exerciseTime / 3600));
      const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

      const sql = `
        INSERT INTO workout_records (user_id, lecture_id, exercise_time, calories_burned, date)
        VALUES (?, ?, ?, ?, ?)
      `;
      db.query(sql, [userId, lecture_id || null, exerciseTime, calories_burned, today], (err, result) => {
        if (err) return res.status(500).json({ message: "서버 오류", error: err });
        res.status(201).json({
          message: "운동 기록이 저장되었습니다.",
          recordId: result.insertId,
          calories_burned,
        });
      });
    };

    if (metSql) {
      db.query(metSql, [metParam], (err, results) => {
        if (err) return res.status(500).json({ message: "서버 오류", error: err });
        const met = results[0]?.met_value || 3.0;
        insertRecord(met);
      });
    } else {
      insertRecord(3.0);
    }
  });
};

// GET /api/workout - 내 운동 기록 목록
exports.getMyWorkouts = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
      wr.id, wr.user_id, wr.lecture_id,
      wr.exercise_time AS duration_sec,
      wr.calories_burned,
      wr.date AS recorded_at,
      l.title AS lecture_title,
      c.title AS course_title
    FROM workout_records wr
    LEFT JOIN lectures l ON wr.lecture_id = l.id
    LEFT JOIN courses c ON l.course_id = c.id
    WHERE wr.user_id = ?
    ORDER BY wr.date DESC, wr.id DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    res.json(results);
  });
};

// GET /api/workout/stats - 날짜별 통계 (최근 30일)
exports.getMyStats = (req, res) => {
  const userId = req.user.id;

  const sql = `
    SELECT
      date,
      COUNT(*) AS total_sessions,
      SUM(exercise_time) AS total_duration_sec,
      SUM(calories_burned) AS total_calories
    FROM workout_records
    WHERE user_id = ?
      AND date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
    GROUP BY date
    ORDER BY date DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    res.json(results);
  });
};
