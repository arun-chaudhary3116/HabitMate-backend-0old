import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Initialize flag to track if configured
let isConfigured = false;

const configureCloudinary = () => {
  if (isConfigured) return;

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  isConfigured = true;
  console.log("✅ Cloudinary configured");
};

// utils/cloudinary.js
const uploadOnCloudinary = async (localFilePath) => {
  try {
    configureCloudinary(); // Ensure config before upload

    if (!localFilePath) {
      console.log("❌ No file path provided");
      return null;
    }

    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });

    //file uploaded successfully so now i have to remove file from my local storage
    // console.log("✅ File uploaded to Cloudinary:", response.secure_url);
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.error("🔥 Cloudinary upload failed:", error.message);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log("🗑️ Deleted local temp file");
    }
    return null;
  }
};

export { cloudinary, configureCloudinary, uploadOnCloudinary };
