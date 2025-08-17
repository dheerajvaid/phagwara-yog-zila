const mongoose = require('mongoose');

const yatraSchema = new mongoose.Schema({
  mobile: { type: String, required: true, unique: true },
  name: String,
  gender: String,
  dob: Date,
  age: Number,
  onwardPNR: String,
  onwardCoach: String,
  onwardSeat: String,
  returnPNR: String,
  returnCoach: String,
  returnSeat: String,
  remarks: String,
  registeredAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Yatra', yatraSchema);
