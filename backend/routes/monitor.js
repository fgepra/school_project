const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/monitorController');

// 헬스체크 (인증 불필요)
router.get('/health', ctrl.healthCheck);

// API 통계 (admin)
router.get('/stats', auth, requireAdmin, ctrl.getMonitorStats);

module.exports = router;
