const mongoose = require('mongoose');

const kenderSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  zila: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zila',
    required: true
  },
  ksheter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ksheter',
    required: true
  }
});

module.exports = mongoose.model('Kender', kenderSchema);
