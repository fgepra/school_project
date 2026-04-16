const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { requireInstructor } = require("../middleware/roleMiddleware");
const upload = require("../middleware/upload");
const instructorController = require("../controllers/instructorController");

// 모든 강사 라우트는 인증 + 강사/관리자 권한 필요
router.use(authMiddleware, requireInstructor);

// ─── 강의(Course) 관리 ─────────────────────────────────────────
// GET  /api/instructor/courses             - 내 강의 목록
// POST /api/instructor/courses             - 강의 생성 (thumbnail 이미지 업로드)
// PUT  /api/instructor/courses/:courseId  - 강의 수정 (thumbnail 이미지 업로드)
// DELETE /api/instructor/courses/:courseId - 강의 삭제

router.get("/courses", instructorController.getMyCourses);
router.post("/courses", upload.single("thumbnail"), instructorController.createCourse);
router.put("/courses/:courseId", upload.single("thumbnail"), instructorController.updateCourse);
router.delete("/courses/:courseId", instructorController.deleteCourse);

// ─── 강의 영상(Lecture) 관리 ──────────────────────────────────
// GET  /api/instructor/courses/:courseId/lectures  - 강의 영상 목록
// POST /api/instructor/courses/:courseId/lectures  - 강의 영상 추가
// PUT  /api/instructor/lectures/:lectureId          - 강의 영상 수정
// DELETE /api/instructor/lectures/:lectureId        - 강의 영상 삭제

router.get("/courses/:courseId/lectures", instructorController.getCourseLectures);
router.post("/courses/:courseId/lectures", instructorController.createLecture);
router.put("/lectures/:lectureId", instructorController.updateLecture);
router.delete("/lectures/:lectureId", instructorController.deleteLecture);

module.exports = router;
