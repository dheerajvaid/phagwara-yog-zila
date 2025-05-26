// models/Shivir.js
const mongoose = require('mongoose');

const shivirSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  days: Number,
  time: String,
  place: String,
  contactPerson: {
    name: String,
    mobile: String,
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Saadhak' },
  isLive: { type: Boolean, default: false },
  zila: { type: mongoose.Schema.Types.ObjectId, ref: 'Zila' },
  ksheter: { type: mongoose.Schema.Types.ObjectId, ref: 'Ksheter' },
  kender: { type: mongoose.Schema.Types.ObjectId, ref: 'Kender' },
}, { timestamps: true });

module.exports = mongoose.model('Shivir', shivirSchema);
