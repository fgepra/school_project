const express = require("express");
const router = express.Router();
const controller = require("../controllers/progressController");
const auth = require("../middleware/authMiddleware");

// 진도 저장 (로그인 필요)
router.post("/", auth, controller.saveProgress);

// 유저 진도 조회
router.get("/:userId", auth, controller.getProgressByUser);

module.exports = router;
