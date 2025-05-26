// models/ShivirRegistration.js
const mongoose = require('mongoose');

const shivirRegSchema = new mongoose.Schema({
  shivir: { type: mongoose.Schema.Types.ObjectId, ref: 'Shivir' },
  saadhak: { type: mongoose.Schema.Types.ObjectId, ref: 'Saadhak' },
  name: String,
  mobile: String,
  gender: String,
  age: Number,
  address: String,
}, { timestamps: true });

module.exports = mongoose.model('ShivirReg', shivirRegSchema);
