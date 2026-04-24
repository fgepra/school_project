const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const workoutController = require("../controllers/workoutController");

// 모든 운동 기록 라우트는 인증 필요
router.use(authMiddleware);

// GET /api/workout/stats - 날짜별 통계 (stats를 먼저 등록해야 /:id 라우팅 충돌 방지)
router.get("/stats", workoutController.getMyStats);

// GET /api/workout - 내 운동 기록 목록
router.get("/", workoutController.getMyWorkouts);

// POST /api/workout - 운동 기록 저장
router.post("/", workoutController.saveWorkout);

module.exports = router;
