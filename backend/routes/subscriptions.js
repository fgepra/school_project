const express = require('express');
const router = express.Router();
const controller = require('../controllers/subscriptionController');
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');

router.get('/', auth, controller.getMySubscriptions);
router.post('/', auth, controller.updateSubscription);
router.post('/send-digest', auth, requireAdmin, controller.sendWeeklyDigest);

module.exports = router;
