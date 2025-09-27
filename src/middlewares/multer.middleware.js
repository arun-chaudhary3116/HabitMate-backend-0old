import multer from "multer";
import path from "path";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), "public", "temp"));
  },
  filename: function (req, file, cb) {
    //optionally rename file to avoid special characters / duplicates
    const safeName = file.originalname
      .replace(/\s+/g, "_")
      .replace(/[()]/g, "");
    cb(null, `${Date.now()}_${safeName}`);
  },
});

export const upload = multer({ storage });
