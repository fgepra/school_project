const express = require('express');
const router = express.Router();
const controller = require('../controllers/logController');
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.get('/', auth, requireAdmin, controller.getLogs);
router.delete('/old', auth, requireAdmin, controller.deleteOldLogs);

module.exports = router;
