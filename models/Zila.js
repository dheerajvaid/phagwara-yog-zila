const mongoose = require('mongoose');

const zilaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  prant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Prant",
    required: true,
  },
  pradhan: String,
  mantri: String,
  sangathanMantri: String,
  cashier: String
});

module.exports = mongoose.models.Zila || mongoose.model('Zila', zilaSchema);
