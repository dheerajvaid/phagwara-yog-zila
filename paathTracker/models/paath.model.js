// models/paath.model.js
const mongoose = require("mongoose");

const paathSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Saadhak", // or your User model name
    required: true,
  },
  date: {
    type: String, // store as 'YYYY-MM-DD' for easier lookup
    required: true,
  },
  count: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

paathSchema.index({ user: 1, date: 1 }, { unique: true }); // prevent duplicates

module.exports = mongoose.model("Paath", paathSchema);
