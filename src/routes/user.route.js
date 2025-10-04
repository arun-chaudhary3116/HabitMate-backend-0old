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
const FRONTEND_URL = process.env.FRONTEND_URL;

// -------------------- GOOGLE AUTH --------------------
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${FRONTEND_URL}/`,
    session: true,
  }),
  async (req, res) => {
    try {
      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        req.user._id
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
         sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
         sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      });

      res.redirect(`${FRONTEND_URL}/dashboard`);
    } catch (error) {
      console.error("Google callback error:", error);
      res.redirect(`${FRONTEND_URL}/?error=oauth_failed`);
    }
  }
);

// -------------------- GITHUB AUTH --------------------
router.get(
  "/auth/github",
  passport.authenticate("github", { scope: ["user:email"] })
);

router.get(
  "/github/callback",
  passport.authenticate("github", {
    failureRedirect: `${FRONTEND_URL}/`,
    session: true,
  }),
  async (req, res) => {
    try {
      const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
        req.user._id
      );

      res.cookie("accessToken", accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.cookie("refreshToken", refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });

      res.redirect(`${FRONTEND_URL}/dashboard`);
    } catch (error) {
      console.error("GitHub callback error:", error);
      res.redirect(`${FRONTEND_URL}/?error=oauth_failed`);
    }
  }
);

// -------------------- LOCAL AUTH --------------------
router.post("/register", registerUser);
router.post("/login", loginUser);

// -------------------- CURRENT USER --------------------
router.get("/me", verifyJWT, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture || "", // ✅ always return avatar
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

// -------------------- PROFILE --------------------
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

// -------------------- AVATAR UPLOAD (only Cloudinary) --------------------
router.put("/avatar", verifyJWT, upload.single("avatar"), updateAvatar);

// -------------------- TOKENS & PASSWORD --------------------
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", verifyJWT, logoutUser);
router.post("/change-password", verifyJWT, changeCurrentPassword);
router.get("/current-user", verifyJWT, getCurrentUser);

//email route
router.post("/send-verification-email", verifyJWT, sendVerificationEmail);
router.get("/verify-email", verifyEmail);

export default router;
