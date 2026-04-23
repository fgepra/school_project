require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const lectureRoutes = require("./routes/lectures");
const progressRoutes = require("./routes/progress");
const adminRoutes = require("./routes/admin");
const instructorRoutes = require("./routes/instructor");
const commentRoutes = require("./routes/comments");
const workoutRoutes = require("./routes/workout");
const bookmarkRoutes = require("./routes/bookmarks");

const app = express();

app.use(cors());
app.use(express.json());

// 업로드된 이미지 정적 서빙: GET /uploads/thumbnails/파일명.jpg
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/workout", workoutRoutes);
app.use("/api/bookmarks", bookmarkRoutes);

app.listen(process.env.PORT, () => {
  console.log(`서버 실행: ${process.env.PORT}`);
});
