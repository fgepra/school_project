const mysql = require("mysql2");

const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  waitForConnections: true,
  queueLimit: 0,
});

db.query("SELECT 1", (err) => {
  if (err) console.error("DB 연결 실패", err);
  else console.log("DB 연결 완료 (pool)");
});

module.exports = db;
