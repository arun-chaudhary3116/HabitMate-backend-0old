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
// 🌐 CORS Configuration - FIXED
// -------------------------
const allowedOrigins = [
  process.env.FRONTEND_URL, 
  process.env.CORS_ORIGIN,
  "https://habitmate-tws5.onrender.com",
].filter(Boolean);

console.log("✅ Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      
      // Check if origin is in allowed list
      if (allowedOrigins.some(allowed => origin.startsWith(allowed))) {
        return callback(null, true);
      }
      
      // Check for subdomains or variations
      const normalizedOrigin = origin.replace(/\/$/, '');
      const normalizedAllowed = allowedOrigins.map(o => o.replace(/\/$/, ''));
      
      if (normalizedAllowed.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      console.log("❌ CORS blocked origin:", origin);
      const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`;
      return callback(new Error(msg), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "X-Requested-With"
    ],
  })
);

// Handle preflight requests - FIXED for Express v5
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
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    proxy: isProd, // Trust Render's proxy in production
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
app.use("/public", express.static(path.join(process.cwd(), "public")));

// -------------------------
// ✅ Health Check Route
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
// 🎯 SPA Fallback Route - FIXED for Refresh Issue
// -------------------------
// This serves your frontend for any route not handled by API
app.get('*', (req, res, next) => {
  // Skip API routes
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // For non-API routes, you might want to serve a basic response
  // or redirect to your frontend if they're separate
  res.status(200).json({
    success: true,
    message: "HabitMate API Server",
    frontend: process.env.FRONTEND_URL,
    documentation: "API endpoints are available under /api/v2/"
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

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API route ${req.originalUrl} not found`
  });
});

// -------------------------
// ✅ Export app for index.js
// -------------------------
export { app };
