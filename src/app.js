import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";

// 🧭 Import passport strategies (must be before using passport)
import "./db/passport.js";

// 🧭 Import routers
import chatRouter from "./routes/chat.route.js";
import habitRouter from "./routes/habit.route.js";
import journalRouter from "./routes/journal.route.js";
import newsletterRouter from "./routes/newsletter.routes.js";
import userRouter from "./routes/user.route.js";

// -------------------------
// 🚀 App Initialization
// -------------------------
const app = express();
const isProd = process.env.NODE_ENV === "production";

// -------------------------
// 🌐 CORS Configuration
// -------------------------
const allowedOrigins = [process.env.FRONTEND_URL || process.env.CORS_ORIGIN];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin.`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  })
);

// Handle preflight requests - FIXED: Use regex instead of string wildcard
app.options(/.*/, cors());

// -------------------------
// 📦 Middlewares
// -------------------------
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Serve static files (e.g. uploaded images)
app.use(express.static("public"));

// -------------------------
// 🧠 Sessions & Passport
// -------------------------
app.use(
  session({
    secret: process.env.SESSION_SECRET || "chaudhary123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProd,          // true in production with HTTPS
      sameSite: isProd ? "none" : "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// -------------------------
// 🛣 Routes
// -------------------------
app.use("/api/v2/users", userRouter);
app.use("/api/v2/habits", habitRouter);
app.use("/api/v2/journal", journalRouter);
app.use("/api/v2/chat", chatRouter);
app.use("/api/v2/newsletter", newsletterRouter);

// -------------------------
// 🧭 Static Public Folder
// -------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve files via /public route
app.use("/public", express.static(path.join(process.cwd(), "../public")));

// -------------------------
// ✅ Health Check Route
// -------------------------
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running healthy",
    timestamp: new Date().toISOString()
  });
});

// -------------------------
// 🚨 Error Handling Middleware
// -------------------------
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: isProd ? {} : err.message
  });
});

// -------------------------
// ✅ Export app for index.js
// -------------------------
export { app };
