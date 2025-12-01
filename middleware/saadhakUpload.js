const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const { cloudinary } = require("../utils/cloudinary");

// ---------------- CLOUDINARY STORAGE (PHOTO ONLY) ----------------
const saadhakStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "saadhak_photos",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 500, height: 642, crop: "fill" }],
  },
});

// ---------------- MULTER UPLOADER (single photo, 200KB limit) ----------------
const uploadSaadhakPhoto = multer({ 
  storage: saadhakStorage,
  limits: { fileSize: 200 * 1024 } // 200 KB
}).single("photo");

module.exports = uploadSaadhakPhoto;
