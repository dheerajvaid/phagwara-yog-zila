const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  saadhak: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Saadhak',
    required: true
  },
  date: {
    type: Date, // ✅ CHANGED from String to Date
    required: true
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    default: 'Present'
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Attendance', attendanceSchema);
