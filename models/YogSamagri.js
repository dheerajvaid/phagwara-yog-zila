const mongoose = require('mongoose');

const yogSamagriSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('YogSamagri', yogSamagriSchema);
