const express = require("express");
const router = express.Router();
const controller = require("../controllers/courseController");

router.get("/", controller.getCourses);
router.get("/:id", controller.getCourseById);

module.exports = router;