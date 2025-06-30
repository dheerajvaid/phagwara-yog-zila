const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,

  // ✅ Updated: Now each image will have { url, public_id }
  imageUrls: [
    {
      url: String,
      public_id: String,
    },
  ],

  // ✅ Updated: Video with public_id
  videoUrl: String,
  videoPublicId: String,

  // ✅ Updated: Audio with public_id
  audioUrl: String,
  audioPublicId: String,

  // ✅ Updated: File with public_id
  fileUrl: String,
  filePublicId: String,
  fileResourceType: String,
});

module.exports = mongoose.model('Event', eventSchema);
