// models/Ksheter.js
const mongoose = require('mongoose');

const ksheterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  zila: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Zila',
    required: true
  }
});

// module.exports = mongoose.model('Ksheter', ksheterSchema);
module.exports = mongoose.models.Ksheter || mongoose.model('Ksheter', ksheterSchema);