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
  prant: { type: mongoose.Schema.Types.ObjectId, ref: 'Prant' },
  zila: { type: mongoose.Schema.Types.ObjectId, ref: 'Zila' },
  ksheter: { type: mongoose.Schema.Types.ObjectId, ref: 'Ksheter' },
  kender: { type: mongoose.Schema.Types.ObjectId, ref: 'Kender' },

  // 🔹 Newly added fields
  doj: Date, // Date of Joining
  email: String, // Not required

    // 🔹 Fitness-related fields
  weightKg: Number,        // e.g. 87
  heightFeet: Number,      // e.g. 5
  heightInches: Number,    // e.g. 6
}, { timestamps: true });

module.exports = mongoose.models.Saadhak || mongoose.model("Saadhak", saadhakSchema);
