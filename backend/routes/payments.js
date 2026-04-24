const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const { requireAdmin } = require('../middleware/roleMiddleware');
const ctrl = require('../controllers/paymentController');

// 결제 처리
router.post('/', auth, ctrl.processPayment);

// 내 결제 내역
router.get('/my', auth, ctrl.getMyPayments);

// 구매 여부 확인
router.get('/check/:courseId', auth, ctrl.checkPurchase);

// 환불 처리 (본인 or admin)
router.post('/:paymentId/refund', auth, ctrl.refundPayment);

// 전체 결제 내역 (admin)
router.get('/all', auth, requireAdmin, ctrl.getAllPayments);

module.exports = router;
