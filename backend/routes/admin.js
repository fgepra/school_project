const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireAdmin } = require("../middleware/roleMiddleware");
const adminController = require("../controllers/adminController");

// 모든 관리자 라우트는 인증 + 관리자 권한 필요
router.use(authMiddleware, requireAdmin);

// GET /api/admin/users - 전체 유저 목록
router.get("/users", adminController.getUsers);

// PATCH /api/admin/users/:userId/role - 유저 역할 변경
router.patch("/users/:userId/role", adminController.updateUserRole);

// GET /api/admin/stats - 통계 조회
router.get("/stats", adminController.getStats);

module.exports = router;
