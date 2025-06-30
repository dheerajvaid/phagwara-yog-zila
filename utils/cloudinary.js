const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
require("dotenv").config();

// Configure Cloudinary credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure storage for multer
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = "bys/events/others";
    let resource_type = "raw";

    if (file.mimetype.startsWith("image/")) {
      folder = "bys/events/images";
      resource_type = "image";
    } else if (file.mimetype.startsWith("video/")) {
      folder = "bys/events/videos";
      resource_type = "video";
    } else if (file.mimetype.startsWith("audio/")) {
      folder = "bys/events/audios";
      resource_type = "video"; // audio is treated under 'video' in Cloudinary
    } else if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.mimetype ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" ||
      file.mimetype === "application/zip" ||
      file.mimetype === "application/x-zip-compressed" ||
      file.mimetype === "application/x-rar-compressed"
    ) {
      folder = "bys/events/files";
      resource_type = "raw";
    }

    // ✅ Get original filename without extension
    const originalNameWithoutExt = file.originalname
      .split(".")
      .slice(0, -1)
      .join(".")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    // ✅ Optionally include a safe version of event title
    const safeTitle = req.body.title
      ? req.body.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "")
          .substring(0, 30)
      : "event";

    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0"); // Month is 0-indexed
    const yy = String(now.getFullYear()).slice(-2);
    const hh = String(now.getHours()).padStart(2, "0");
    const min = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");

    const timestamp = `${dd}${mm}${yy}${hh}${min}${ss}`;
    const customFileName = `${safeTitle}-${originalNameWithoutExt}-${timestamp}`;

    return {
      folder,
      public_id: customFileName,
      resource_type,
      type: "upload",
    };
  },
});

module.exports = {
  cloudinary,
  storage,
};
