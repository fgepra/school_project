const express = require("express");
const router = express.Router();
const controller = require("../controllers/progressController");

// 진도 저장
router.post("/", controller.saveProgress);

// 유저 진도 조회
router.get("/:userId", controller.getProgressByUser);

module.exports = router;