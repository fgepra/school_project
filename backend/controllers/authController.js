const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = (req, res) => {
  const { email, password, name, weight, role } = req.body;

  // role 유효성 검사 (student만 직접 가입 가능, admin은 DB에서 직접 설정)
  const allowedRoles = ['student', 'instructor'];
  const userRole = allowedRoles.includes(role) ? role : 'student';

  const checkSql = "SELECT * FROM users WHERE email = ?";
  db.query(checkSql, [email], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length > 0) {
      return res.status(400).json({
        message: "이미 존재하는 이메일입니다.",
      });
    }

    const hashed = bcrypt.hashSync(password, 10);

    const sql = "INSERT INTO users (email, password, name, weight, role) VALUES (?, ?, ?, ?, ?)";
    db.query(sql, [email, hashed, name, weight || null, userRole], (err, result) => {
      if (err) return res.status(500).json(err);

      const newUserId = result.insertId;
      const token = jwt.sign(
        { id: newUserId, role: userRole },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      res.json({
        token,
        user: { id: newUserId, email, name, weight: weight || null, role: userRole },
        message: "회원가입 성공",
      });
    });
  });
};

exports.login = (req, res) => {
  const { email, password } = req.body;

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json(err);
    if (results.length === 0)
      return res.status(404).json({ message: "유저 없음" });

    const user = results[0];
    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch)
      return res.status(401).json({ message: "비밀번호 틀림" });

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    delete user.password;

    res.json({
      token,
      user,
    });
  });
};

// PUT /api/auth/password - 비밀번호 변경 (auth 필요)
exports.changePassword = (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: "현재 비밀번호와 새 비밀번호를 입력해주세요." });
  }

  db.query("SELECT password FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    if (results.length === 0) return res.status(404).json({ message: "유저 없음" });

    const isMatch = bcrypt.compareSync(currentPassword, results[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: "현재 비밀번호가 올바르지 않습니다." });
    }

    const hashed = bcrypt.hashSync(newPassword, 10);
    db.query("UPDATE users SET password = ? WHERE id = ?", [hashed, userId], (err) => {
      if (err) return res.status(500).json({ message: "서버 오류", error: err });
      res.json({ message: "비밀번호가 변경되었습니다." });
    });
  });
};

// DELETE /api/auth/account - 회원 탈퇴 (auth 필요)
exports.deleteAccount = (req, res) => {
  const userId = req.user.id;
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ message: "비밀번호를 입력해주세요." });
  }

  db.query("SELECT password FROM users WHERE id = ?", [userId], (err, results) => {
    if (err) return res.status(500).json({ message: "서버 오류", error: err });
    if (results.length === 0) return res.status(404).json({ message: "유저 없음" });

    const isMatch = bcrypt.compareSync(password, results[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: "비밀번호가 올바르지 않습니다." });
    }

    db.query("DELETE FROM users WHERE id = ?", [userId], (err) => {
      if (err) return res.status(500).json({ message: "서버 오류", error: err });
      res.json({ message: "회원 탈퇴가 완료되었습니다." });
    });
  });
};
