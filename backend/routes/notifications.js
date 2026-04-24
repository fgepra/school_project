const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const ctrl = require('../controllers/notificationController');

// 내 알림 목록
router.get('/', auth, ctrl.getMyNotifications);

// 미읽음 수
router.get('/unread-count', auth, ctrl.getUnreadCount);

// 전체 읽음 처리 (반드시 /:id/read 보다 먼저 등록)
router.patch('/read-all', auth, ctrl.markAllAsRead);

// 개별 읽음 처리
router.patch('/:id/read', auth, ctrl.markAsRead);

// 알림 삭제
router.delete('/:id', auth, ctrl.deleteNotification);

module.exports = router;
