import express from "express";
import { chatWithDeepSeek } from "../controllers/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Only verified users can access
router.post(
  "/chat",
  verifyJWT,
  (req, res, next) => {
    if (!req.user.isEmailVerified)
      return res
        .status(403)
        .json({ success: false, message: "Verify your email first" });
    next();
  },
  chatWithDeepSeek
);

export default router;
