const express = require("express");
const router = express.Router();
const controller = require("../controllers/lectureController");

// 강의 ID로 단건 조회 (반드시 /:courseId 보다 앞에 정의)
router.get("/id/:id", controller.getLectureById);

// 코스별 강의 목록
router.get("/:courseId", controller.getLectures);

module.exports = router;