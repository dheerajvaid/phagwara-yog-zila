// models/Saadhak.js
const mongoose = require('mongoose');

const saadhakSchema = new mongoose.Schema({
  name: { type: String, required: true },
  password: { type: String, default: null },
  mobile: { type: String, required: true, unique: true },
  dob: Date,
  gender: String,
  maritalStatus: String,
  marriageDate: Date,
  address: String,
  livingArea: String,
  role: {
    type: [String], // Array of roles
    required: true,
    default: ['Saadhak']
  },
  zila: { type: mongoose.Schema.Types.ObjectId, ref: 'Zila' },
  ksheter: { type: mongoose.Schema.Types.ObjectId, ref: 'Ksheter' },
  kender: { type: mongoose.Schema.Types.ObjectId, ref: 'Kender' },
}, { timestamps: true });

module.exports = mongoose.model('Saadhak', saadhakSchema);
