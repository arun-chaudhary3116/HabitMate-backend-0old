// import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";
import jwt from "jsonwebtoken"; // ✅ FIX: import jwt
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  cloudinary,
  configureCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.js";
import { sendEmail } from "../utils/email.js";
const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({
      validateBeforeSave: false,
    });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;

  // if ([email, username, password].some((field) => field?.trim() === "")) {
  //   throw new ApiError(400, "All fields are required");
  // }
  if (!email || !username || !password) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [
      username ? { username: username.toLowerCase() } : {},
      email ? { email: email.toLowerCase() } : {},
    ],
  });

  if (existedUser) {
    throw new ApiError(400, "User already exists");
  }

  const user = await User.create({
    email: email?.trim().toLowerCase(),
    username: username?.trim().toLowerCase(),
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "Created user successfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, username, password } = req.body;
  if (!username && !email) {
    throw new ApiError(400, "Username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exist");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(404, "Invalid user credential");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const option = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, option)
    .cookie("refreshToken", refreshToken, option)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );
});

// ✅ Refresh token endpoint
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken =
      req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request - No refresh token");
    }

    // Verify the refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Find user by the decoded token ID
    const user = await User.findById(decodedToken._id);

    if (!user) {
      throw new ApiError(401, "Invalid refresh token - User not found");
    }

    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access token refreshed successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out"));
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid old password");
  }

  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select(
    "-password -refreshToken"
  );

  if (!user) throw new ApiError(404, "User not found");

  res.status(200).json(
    new ApiResponse(
      200,
      {
        _id: user._id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture || "", // always include avatar
        bio: user.bio || "",
        authProvider: user.authProvider || "local",
        createdAt: user.createdAt,
      },
      "Current user fetched successfully"
    )
  );
});

export const updateAvatar = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const file = req.file;

  if (!file) {
    return res
      .status(400)
      .json({ success: false, message: "No file uploaded" });
  }
  // Configure Cloudinary before any operation
  configureCloudinary();

  // Fetch user to check old profile picture
  const user = await User.findById(userId);
  if (user.profilePicturePublicId) {
    try {
      await cloudinary.uploader.destroy(user.profilePicturePublicId);
      console.log("✅ Old profile picture deleted from Cloudinary");
    } catch (err) {
      console.error("Failed to delete old Cloudinary image:", err);
    }
  }
  // Upload to Cloudinary
  const uploadResult = await uploadOnCloudinary(file.path);
  if (!uploadResult) return res.status(500).json({ message: "Upload failed" });

  // Save URL to user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    {
      profilePicture: uploadResult.secure_url,
      profilePicturePublicId: uploadResult.public_id,
    },
    { new: true }
  ).select("-password -refreshToken");

  res.status(200).json({
    success: true,
    user: updatedUser,
    message: "Avatar updated successfully",
  });
});
export const updateProfile = asyncHandler(async (req, res) => {
  const { username, bio } = req.body;
  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { ...(username && { username }), ...(bio && { bio }) },
    { new: true, runValidators: true }
  ).select("-password -refreshToken");

  res.status(200).json({
    success: true,
    user: updatedUser,
    message: "Profile updated successfully",
  });
});

//email
// sendVerificationEmail
export const sendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    const token = crypto.randomBytes(32).toString("hex");
    user.emailVerificationToken = token;
    user.emailVerificationExpires = Date.now() + 1000 * 60 * 60 * 24; // 24 hours
    await user.save();

    const verificationUrl = `http://localhost:8080/verify-email?token=${token}`;

    await sendEmail({
      to: user.email,
      subject: "Verify your email",
      html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
    });

    res.json({ success: true, message: "Verification email sent" });
  } catch (err) {
    console.error("sendVerificationEmail error:", err);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
};

// verifyEmail

export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(400).json({ success: false, message: "Invalid token" });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Token expired or invalid" });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    return res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export {
  changeCurrentPassword,
  generateAccessAndRefreshToken,
  getCurrentUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
};
