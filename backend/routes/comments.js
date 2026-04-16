const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireInstructor } = require("../middleware/roleMiddleware");
const commentController = require("../controllers/commentController");

// GET /api/comments/lecture/:lectureId - 댓글 목록 (인증 필요)
router.get("/lecture/:lectureId", authMiddleware, commentController.getComments);

// POST /api/comments/lecture/:lectureId - 댓글 작성 (모든 인증 유저)
router.post("/lecture/:lectureId", authMiddleware, commentController.createComment);

// DELETE /api/comments/:commentId - 댓글 삭제 (본인 or 관리자)
router.delete("/:commentId", authMiddleware, commentController.deleteComment);

// POST /api/comments/:commentId/replies - 답글 작성 (강사/관리자만)
router.post("/:commentId/replies", authMiddleware, requireInstructor, commentController.createReply);

// DELETE /api/comments/replies/:replyId - 답글 삭제 (본인 or 관리자)
router.delete("/replies/:replyId", authMiddleware, commentController.deleteReply);

module.exports = router;
