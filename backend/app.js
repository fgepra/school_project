require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

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
const settlementRoutes = require("./routes/settlements");
const monitorRoutes = require("./routes/monitor");
const logRoutes = require("./routes/logs");
const subscriptionRoutes = require("./routes/subscriptions");

const { metricsMiddleware } = require("./middleware/metricsMiddleware");
const errorMiddleware = require("./middleware/errorMiddleware");
const { registerScheduler } = require("./scheduler");
const logger = require("./utils/logger");

const app = express();

// 보안 헤더 (XSS, clickjacking 방어)
app.use(helmet({
  contentSecurityPolicy: false,  // Next.js 프록시 환경에서 CSP는 별도 설정
  crossOriginEmbedderPolicy: false,
}));

app.use(cors());
app.use(express.json({ limit: '5mb' }));

// API 메트릭 미들웨어 (모든 요청 추적)
app.use(metricsMiddleware);

// 업로드된 이미지 정적 서빙
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// 로그인 브루트포스 방지
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: '요청이 너무 많습니다. 15분 후 다시 시도해주세요.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", loginLimiter);

// 라우트 등록
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
app.use("/api/monitor", monitorRoutes);
app.use("/api/logs", logRoutes);
app.use("/api/subscriptions", subscriptionRoutes);

// 중앙화 에러 핸들러 (반드시 마지막에 등록)
app.use(errorMiddleware);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`서버 실행: ${PORT}`);
  registerScheduler();
});
