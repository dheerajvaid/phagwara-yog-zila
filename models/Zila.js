const mongoose = require('mongoose');

const zilaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  pradhan: String,
  mantri: String,
  sangathanMantri: String,
  cashier: String
});

module.exports = mongoose.model('Zila', zilaSchema);
