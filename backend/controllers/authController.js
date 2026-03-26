const db = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.register = (req, res) => {
  const { email, password, name, weight } = req.body;

  const checkSql = "SELECT * FROM users WHERE email = ?";
  db.query(checkSql, [email], (err, results) => {
    if (err) return res.status(500).json(err);

    if (results.length > 0) {
      return res.status(400).json({
        message: "이미 존재하는 이메일입니다.",
      });
    }

  const hashed = bcrypt.hashSync(password, 10);

  const sql = "INSERT INTO users (email, password, name, weight) VALUES (?, ?, ?, ?)";
   db.query(sql, [email, hashed, name, weight], (err, result) => {
     if (err) return res.status(500).json(err);
    res.json({ message: "회원가입 성공" });
   });
 });
}

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
      { id: user.id },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    delete user.password;

    res.json({
      token,
      user,
    });
  });
};