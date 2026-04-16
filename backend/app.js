require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const lectureRoutes = require("./routes/lectures");
const progressRoutes = require("./routes/progress");
const adminRoutes = require("./routes/admin");
const instructorRoutes = require("./routes/instructor");
const commentRoutes = require("./routes/comments");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/instructor", instructorRoutes);
app.use("/api/comments", commentRoutes);

app.listen(process.env.PORT, () => {
  console.log(`서버 실행: ${process.env.PORT}`);
});
