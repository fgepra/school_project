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
const paymentRoutes = require("./routes/payments");
const notificationRoutes = require("./routes/notifications");
const settlementRoutes = require("./routes/settlement");
const logRoutes = require("./routes/logs");
const monitorRoutes = require("./routes/monitor");

const logMiddleware = require("./middleware/logMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");
const { metricsMiddleware } = require("./middleware/metricsMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

// 메트릭 & 로그 미들웨어
app.use(metricsMiddleware);
app.use(logMiddleware);

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
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/settlement", settlementRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/monitor", monitorRoutes);
// /api/health 단독 라우트
app.get("/api/health", require("./controllers/monitorController").healthCheck);

// 중앙 에러 핸들러 (반드시 마지막)
app.use(errorMiddleware);

// 스케줄러 시작
require("./scheduler");

app.listen(process.env.PORT, () => {
  console.log(`서버 실행: ${process.env.PORT}`);
});
