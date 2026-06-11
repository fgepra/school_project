const express = require('express');
const router = express.Router();
const controller = require('../controllers/paymentController');
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const { paymentRules, validate } = require('../middleware/validationMiddleware');

router.post('/', auth, paymentRules, validate, controller.processPayment);
router.get('/my', auth, controller.getMyPayments);
router.get('/check/:courseId', auth, controller.checkPurchase);
router.post('/:id/refund', auth, controller.refund);
router.get('/all', auth, requireAdmin, controller.getAllPayments);

module.exports = router;
