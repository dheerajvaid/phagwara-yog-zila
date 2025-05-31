const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    let folder = 'events_media/others';

    if (file.mimetype.startsWith('image')) {
      folder = 'events_media/images';
    } else if (file.mimetype.startsWith('video')) {
      folder = 'events_media/videos';
    } else if (file.mimetype.startsWith('audio')) {
      folder = 'events_media/audios';
    }

    return {
      folder,
      resource_type: 'auto', // required to support all media types
    };
  },
});

module.exports = {
  cloudinary,
  storage,
};
