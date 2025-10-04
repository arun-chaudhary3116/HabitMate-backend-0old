import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";

const app = express();
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || process.env.FRONTEND_URL,
    credentials: true,
  })
);
//data come as json format from frontend
app.use(express.json({ limit: "16kb" }));

//data come as link
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

//store images in my local storage
app.use(express.static("public"));

app.use(cookieParser());

//routes import
import chatRouter from "./routes/chat.route.js";
import habitRouter from "./routes/habit.route.js";
import journalRouter from "./routes/journal.route.js";
import newsletterRouter from "./routes/newsletter.routes.js";
import userRouter from "./routes/user.route.js";

//routes declaration
// app.use("/api/v2/users", userRouter);

import session from "express-session";
import passport from "passport";
import "./db/passport.js"; // import strategy config

app.use(
  session({
    secret: process.env.SESSION_SECRET || "chaudhary123",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: true,
      httpOnly: true,
      sameSite: "lax",
    }, // set secure: true if using HTTPS
  })
);
app.use(passport.initialize());
app.use(passport.session());

// import authRouter from "./routes/user.route.js";
// app.use("/api/v2/users/auth", authRouter);
//routes import

//routes declaration
app.use("/api/v2/users", userRouter);
app.use("/api/v2/habits", habitRouter);
app.use("/api/v2/journal", journalRouter);
app.use("/api/v2/chat", chatRouter);
app.use("/api/v2/newsletter", newsletterRouter);

import path from "path";
import { fileURLToPath } from "url";

// __dirname is not defined in ES modules, so create it
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve static files from the "public" folder
app.use("/public", express.static(path.join(process.cwd(), "../public")));
export { app };
