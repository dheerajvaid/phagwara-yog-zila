  // models/Ksheter.js
  const mongoose = require('mongoose');

  const ksheterSchema = new mongoose.Schema({
    name: {
      type: String,
      required: true,
      trim: true
    },
    prant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Prant',
      required: true
    },
    zila: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Zila',
      required: true
    }
  });

  module.exports = mongoose.models.Ksheter || mongoose.model('Ksheter', ksheterSchema);
