const express = require("express");
const router = express.Router();
const controller = require("../controllers/lectureController");

router.get("/by-id/:id", controller.getLectureById);
router.get("/:courseId", controller.getLectures);

module.exports = router;