const express = require('express');
const router = express.Router();
const controller = require('../controllers/monitorController');
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.get('/health', controller.health);
router.get('/stats', auth, requireAdmin, controller.getStats);

module.exports = router;
