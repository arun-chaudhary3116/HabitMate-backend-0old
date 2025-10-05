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
const allowedOrigins = [
  process.env.FRONTEND_URL,
  process.env.CORS_ORIGIN,
  "https://habitmate-tws5.onrender.com"
].filter(Boolean);

console.log("✅ Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.some(allowed => origin.includes(allowed.replace(/https?:\/\//, '')))) {
        return callback(null, true);
      }

      console.log("❌ CORS blocked origin:", origin);
      return callback(new Error(`CORS not allowed for origin: ${origin}`), false);
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

// Handle preflight requests - FIXED: Use regex instead of string
app.options(/.*/, cors());

// -------------------------
// 📦 Middlewares
// -------------------------
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// Serve static files
app.use(express.static("public"));

// -------------------------
// 🧠 Sessions & Passport
// -------------------------
// Use MongoDB store instead of MemoryStore for production
const MemoryStore = session.MemoryStore;
app.use(
  session({
    secret: process.env.SESSION_SECRET || "chaudhary123",
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore(),
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
      maxAge: 24 * 60 * 60 * 1000
    },
    proxy: isProd,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// -------------------------
// 🛣 API Routes
// -------------------------
app.use("/api/v2/users", userRouter);
app.use("/api/v2/habits", habitRouter);
app.use("/api/v2/journal", journalRouter);
app.use("/api/v2/chat", chatRouter);
app.use("/api/v2/newsletter", newsletterRouter);

// -------------------------
// 🧭 Static Files
// -------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/public", express.static(path.join(__dirname, "../public")));

// -------------------------
// ✅ Health Check
// -------------------------
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running healthy",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// -------------------------
// 🏠 Home Route
// -------------------------
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "HabitMate API Server",
    version: "1.0.0",
    frontend: process.env.FRONTEND_URL,
    documentation: "API endpoints available under /api/v2/"
  });
});

// -------------------------
// 🔧 Express v5 Compatible Catch-All Route
// -------------------------
// Use regex pattern instead of string wildcard for Express v5
app.get(/^(?!\/api\/).*$/, (req, res) => {
  res.json({
    success: true,
    message: "HabitMate API Server - Use API endpoints under /api/v2/",
    frontend: process.env.FRONTEND_URL || process.env.CORS_ORIGIN
  });
});

// -------------------------
// 🚨 Error Handling
// -------------------------
app.use((err, req, res, next) => {
  console.error("Error:", err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: isProd ? {} : err.message
  });
});

// 404 handler for API routes
app.use("/api/*", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`
  });
});

// -------------------------
// ✅ Export app
// -------------------------
export { app };
