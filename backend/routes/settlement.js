const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { requireAdmin, requireInstructor } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/settlementController');

// 강사 본인 정산 내역
router.get('/instructor', auth, requireInstructor, ctrl.getInstructorSettlement);

// 강사 월별 매출 통계
router.get('/instructor/monthly', auth, requireInstructor, ctrl.getInstructorMonthlyStats);

// 강사 정산 신청
router.post('/instructor/request', auth, requireInstructor, ctrl.requestSettlement);

// 관리자 전체 정산 내역
router.get('/admin', auth, requireAdmin, ctrl.getAdminSettlement);

// 기간별 매출 통계
router.get('/admin/stats', auth, requireAdmin, ctrl.getAdminStats);

// 정산 생성 (admin)
router.post('/admin/generate', auth, requireAdmin, ctrl.generateSettlement);

// CSV 내보내기 (admin)
router.get('/admin/export', auth, requireAdmin, ctrl.exportSettlementCSV);

module.exports = router;
