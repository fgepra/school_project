const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/logController');

// 최근 로그 200개 (admin)
router.get('/', auth, requireAdmin, ctrl.getLogs);

// 30일 이상 된 로그 삭제 (admin)
router.delete('/old', auth, requireAdmin, ctrl.deleteOldLogs);

module.exports = router;
