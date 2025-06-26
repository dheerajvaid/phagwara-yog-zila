const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: String,
  description: String,
  date: Date,
  imageUrls: [String],   // Multiple images
  videoUrl: String,      // Single video (unchanged)
  audioUrl: String,      // Single audio (unchanged)
  fileUrl: String        // New: single downloadable file (PDF, DOC, etc.)
});

module.exports = mongoose.model('Event', eventSchema);
