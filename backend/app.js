require("dotenv").config();
const express = require("express");
const cors = require("cors");

const authRoutes = require("./routes/auth");
const courseRoutes = require("./routes/courses");
const lectureRoutes = require("./routes/lectures");
const progressRoutes = require("./routes/progress");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/lectures", lectureRoutes);
app.use("/api/progress", progressRoutes);

app.listen(process.env.PORT, () => {
  console.log(`서버 실행: ${process.env.PORT}`);
});