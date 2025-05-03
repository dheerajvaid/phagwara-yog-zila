const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  mobile: { type: String, required: true },
  code: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 300 } // 5 min expiry
});

module.exports = mongoose.model('Otp', otpSchema);
