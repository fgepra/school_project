// backend/routes/bookmarks.js

const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { toggleBookmark, getMyBookmarks, checkBookmark } = require("../controllers/bookmarkController");

router.use(authMiddleware);

router.get("/", getMyBookmarks);
router.get("/:courseId", checkBookmark);
router.post("/:courseId", toggleBookmark);

module.exports = router;
