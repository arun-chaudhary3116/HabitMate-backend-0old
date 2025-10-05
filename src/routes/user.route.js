import { Router } from "express";
import passport from "passport";
import {
  changeCurrentPassword,
  generateAccessAndRefreshToken,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  sendVerificationEmail,
  updateAvatar,
  updateProfile,
  verifyEmail,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { Habit } from "../models/habit.model.js";
import { User } from "../models/user.model.js";

const router = Router();
const isProd = process.env.NODE_ENV === "production";

// ✅ Validate FRONTEND_URL once
const FRONTEND_URL = process.env.FRONTEND_URL;
const BACKEND_URL = process.env.BACKEND_URL || "https://habitmate-backend.onrender.com";

if (!FRONTEND_URL || !/^https?:\/\//.test(FRONTEND_URL)) {
  console.error("❌ Invalid FRONTEND_URL in environment:", FRONTEND_URL);
  throw new Error(
    "FRONTEND_URL is not set correctly in the environment variables."
  );
}

console.log("✅ Using FRONTEND_URL:", FRONTEND_URL);
console.log("✅ Using BACKEND_URL:", BACKEND_URL);

/* =======================
   🌐 GOOGLE AUTH - FIXED Callback URLs
======================= */
router.get(
  "/auth/google",
  (req, res, next) => {
    console.log("🔐 Google OAuth initiated");
    next();
  },
  passport.authenticate("google", { 
    scope: ["profile", "email"],
    accessType: 'offline',
    prompt: 'consent'
  })
);

router.get(
  "/google/callback",
  (req, res, next) => {
    console.log("🔄 Google OAuth callback received");
    console.log("📋 Query params:", req.query);
    next();
  },
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed`,
    session: true,
  }),
  async (req, res) => {
    try {
      console.log("✅ Google OAuth successful for user:", req.user?.email);
      
      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        req.user._id
      );

      // Set cookies
      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
      
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      console.log("🍪 Cookies set, redirecting to dashboard");
      res.redirect(`${FRONTEND_URL}/dashboard`);
    } catch (error) {
      console.error("❌ Google callback error:", error);
      res.redirect(`${FRONTEND_URL}/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
    }
  }
);
// Add this route to test Google OAuth configuration
router.get("/auth/google/config", (req, res) => {
  res.json({
    success: true,
    hasClientId: !!process.env.GOOGLE_CLIENT_ID,
    hasClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
    backendUrl: process.env.BACKEND_URL,
    callbackUrl: `${process.env.BACKEND_URL}/api/v2/users/google/callback`
  });
});
/* =======================
   🐙 GITHUB AUTH - FIXED Callback URLs
======================= */
router.get(
  "/auth/github",
  (req, res, next) => {
    console.log("🔐 GitHub OAuth initiated");
    next();
  },
  passport.authenticate("github", { 
    scope: ["user:email"] 
  })
);

router.get(
  "/github/callback",
  (req, res, next) => {
    console.log("🔄 GitHub OAuth callback received");
    next();
  },
  passport.authenticate("github", {
    failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed`,
    session: true,
  }),
  async (req, res) => {
    try {
      console.log("✅ GitHub OAuth successful for user:", req.user?.email);
      
      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        req.user._id
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 15 * 60 * 1000 // 15 minutes
      });
      
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? "none" : "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });

      console.log("🍪 Cookies set, redirecting to dashboard");
      res.redirect(`${FRONTEND_URL}/dashboard`);
    } catch (error) {
      console.error("❌ GitHub callback error:", error);
      res.redirect(`${FRONTEND_URL}/login?error=oauth_failed&message=${encodeURIComponent(error.message)}`);
    }
  }
);

/* =======================
   👤 LOCAL AUTH
======================= */
router.post("/register", registerUser);
router.post("/login", loginUser);

/* =======================
   👤 CURRENT USER
======================= */
router.get("/me", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture || "",
        authProvider: user.authProvider || "local",
        bio: user.bio || "",
        createdAt: user.createdAt,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    console.error("GET /me error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

/* =======================
   ✏️ PROFILE
======================= */
router.get("/profile", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    const habits = await Habit.find({ owner: req.user._id });
    const totalHabits = habits.length;
    const longestStreak = Math.max(...habits.map((h) => h.streak || 0), 0);
    const completedHabits = habits.reduce(
      (sum, h) => sum + (h.completedCount || 0),
      0
    );

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        profilePicture: user.profilePicture || "",
        totalHabits,
        longestStreak,
        completedHabits,
      },
    });
  } catch (error) {
    console.error("GET /profile error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/profile", verifyJWT, updateProfile);

/* =======================
   📸 AVATAR UPLOAD
======================= */
router.put("/avatar", verifyJWT, upload.single("avatar"), updateAvatar);

/* =======================
   🔑 TOKENS & PASSWORD
======================= */
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", verifyJWT, logoutUser);
router.post("/change-password", verifyJWT, changeCurrentPassword);
router.get("/current-user", verifyJWT, getCurrentUser);

/* =======================
   📧 EMAIL VERIFICATION
======================= */
router.post("/send-verification-email", verifyJWT, sendVerificationEmail);
router.get("/verify-email", verifyEmail);

export default router;
