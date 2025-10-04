import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import session from "express-session";
import passport from "passport";
import path from "path";
import { fileURLToPath } from "url";

import "./db/passport.js"; // Google OAuth config

import userRouter from "./routes/user.route.js";
import habitRouter from "./routes/habit.route.js";
import journalRouter from "./routes/journal.route.js";
import chatRouter from "./routes/chat.route.js";
import newsletterRouter from "./routes/newsletter.routes.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// -------------------- MIDDLEWARES --------------------
app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

// SESSION + PASSPORT
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // true only in HTTPS
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// -------------------- STATIC --------------------
app.use("/public", express.static(path.join(__dirname, "../public")));

// -------------------- ROUTES --------------------
app.use("/api/v2/users", userRouter);
app.use("/api/v2/habits", habitRouter);
app.use("/api/v2/journal", journalRouter);
app.use("/api/v2/chat", chatRouter);
app.use("/api/v2/newsletter", newsletterRouter);

export { app };
