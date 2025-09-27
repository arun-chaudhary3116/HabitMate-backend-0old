import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

// Middleware to verify JWT tokens
export const verifyJWT = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken;
    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Not authenticated" });
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    //fetch user from db excluding password
    const user = await User.findById(decoded._id).select("-password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    req.user = user; // attach full user object to request
    next();
  } catch (err) {
    console.error("JWT verification failed:", err);
    return res
      .status(401)
      .json({ success: false, message: "Invalid or expired token" });
  }
};

// Middleware that supports BOTH session (Google/GitHub) and JWT
export const ensureAuth = async (req, res, next) => {
  try {
    // If OAuth session exists
    if (req.isAuthenticated && req.isAuthenticated()) {
      req.user = req.user;
      return next();
    }

    // If JWT in cookies
    const token = req.cookies.accessToken;
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = await User.findById(decoded._id).select("-password");

    if (!req.user) return res.status(401).json({ message: "Unauthorized" });

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized" });
  }
};

verifyJWT;
