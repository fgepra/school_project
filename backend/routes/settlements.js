const express = require('express');
const router = express.Router();
const controller = require('../controllers/settlementController');
const auth = require('../middleware/authMiddleware');
const { requireAdmin, requireInstructor } = require('../middleware/roleMiddleware');

router.get('/instructor', auth, requireInstructor, controller.getInstructorSettlement);
router.get('/instructor/monthly', auth, requireInstructor, controller.getInstructorMonthlyStats);
router.post('/instructor/request', auth, requireInstructor, controller.requestSettlement);

router.get('/admin', auth, requireAdmin, controller.getAdminSettlement);
router.get('/admin/stats', auth, requireAdmin, controller.getAdminStats);
router.post('/admin/generate', auth, requireAdmin, controller.generateSettlement);
router.get('/admin/export', auth, requireAdmin, controller.exportCSV);

module.exports = router;
