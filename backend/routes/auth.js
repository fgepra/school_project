const express = require("express");
const router = express.Router();
const controller = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/register", controller.register);
router.post("/login", controller.login);

// PUT /api/auth/password - 비밀번호 변경 (auth 필요)
router.put("/password", authMiddleware, controller.changePassword);

// DELETE /api/auth/account - 회원 탈퇴 (auth 필요)
router.delete("/account", authMiddleware, controller.deleteAccount);

module.exports = router;