const express = require('express');
const router = express.Router();
const controller = require('../controllers/notificationController');
const auth = require('../middleware/authMiddleware');

router.get('/', auth, controller.getAll);
router.get('/unread-count', auth, controller.getUnreadCount);
router.patch('/read-all', auth, controller.markAllAsRead);
router.patch('/:id/read', auth, controller.markAsRead);
router.delete('/:id', auth, controller.deleteNotification);

module.exports = router;
