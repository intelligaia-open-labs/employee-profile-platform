import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import { env } from "./config/env";
import { errorHandler } from "./middleware/error";
import { authRouter } from "./routes/auth";
import { employeeRouter } from "./routes/employees";
import { publicRouter } from "./routes/public";
import { meetingRouter } from "./routes/meetings";
import { credentialRouter } from "./routes/credentials";
import { employeePortalRouter } from "./routes/employee-portal";
import { analyticsRouter } from "./routes/analytics";

const app = express();

// Trust proxy (behind nginx)
app.set("trust proxy", 1);

// Security
app.use(helmet());
app.use(cors({
  origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()).filter(Boolean),
  credentials: true,
}));
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
}));

// Body parsing
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Static files for uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// Routes
app.use("/auth", authRouter);
app.use("/employees", employeeRouter);
app.use("/public", publicRouter);
app.use("/meeting-requests", meetingRouter);
app.use("/credentials", credentialRouter);
app.use("/portal", employeePortalRouter);
app.use("/analytics", analyticsRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Error handler
app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`API server running at http://localhost:${env.PORT}`);
});

export default app;
