const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  imageUrls: [String],   // Multiple images
  videoUrl: String,      // Single video
  audioUrl: String       // Single audio
});

module.exports = mongoose.model('Event', eventSchema);
