const express = require("express");
const router = express.Router();
const controller = require("../controllers/lectureController");

router.get("/:courseId", controller.getLectures);

module.exports = router;