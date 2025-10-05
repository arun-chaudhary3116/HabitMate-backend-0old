import dotenv from "dotenv";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import path from "path";
import { fileURLToPath } from "url";
import { User } from "../models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({
  path: path.resolve(__dirname, "../../.env"),
});

// ✅ Validate environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const BACKEND_URL = process.env.BACKEND_URL || "https://habitmate-backend.onrender.com";

console.log("🔐 Google OAuth Config:");
console.log("   Client ID:", GOOGLE_CLIENT_ID ? "✅ Present" : "❌ Missing");
console.log("   Client Secret:", GOOGLE_CLIENT_SECRET ? "✅ Present" : "❌ Missing");
console.log("   Backend URL:", BACKEND_URL);

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error("❌ Missing Google OAuth credentials");
  throw new Error("Google OAuth credentials are required");
}

// Construct callback URL
const GOOGLE_CALLBACK_URL = `${BACKEND_URL}/api/v2/users/google/callback`;
console.log("   Callback URL:", GOOGLE_CALLBACK_URL);

passport.use(
  new GoogleStrategy(
    {
      clientID: GOOGLE_CLIENT_ID,
      clientSecret: GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL,
      proxy: true // Important for production behind proxy
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        console.log("📨 Google OAuth profile received:", {
          id: profile.id,
          displayName: profile.displayName,
          email: profile.emails?.[0]?.value
        });

        if (!profile.emails || !profile.emails[0]) {
          console.error("❌ No email found in Google profile");
          return done(new Error("No email found in Google profile"), null);
        }

        const email = profile.emails[0].value.toLowerCase();

        // Check if user already exists
        let user = await User.findOne({ 
          $or: [
            { email: email },
            { authId: profile.id }
          ]
        });

        if (user) {
          console.log("✅ Existing user found:", user.email);
          // Update user profile if needed
          if (!user.authProvider) {
            user.authProvider = "google";
            user.authId = profile.id;
            user.profilePicture = profile.photos[0]?.value || user.profilePicture;
            await user.save();
          }
        } else {
          // Create new user
          console.log("👤 Creating new user from Google OAuth");
          user = await User.create({
            email: email,
            username: profile.displayName.toLowerCase().replace(/\s+/g, "_"),
            authProvider: "google",
            authId: profile.id,
            profilePicture: profile.photos[0]?.value || "",
            isEmailVerified: true // Google emails are verified
          });
          console.log("✅ New user created:", user.email);
        }

        return done(null, user);
      } catch (err) {
        console.error("❌ Google OAuth strategy error:", err);
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("🔐 Serializing user:", user._id);
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    console.log("🔓 Deserializing user:", id);
    const user = await User.findById(id);
    if (!user) {
      console.error("❌ User not found during deserialization:", id);
      return done(new Error("User not found"), null);
    }
    done(null, user);
  } catch (err) {
    console.error("❌ Deserialization error:", err);
    done(err, null);
  }
});

console.log("✅ Google OAuth strategy configured successfully");
