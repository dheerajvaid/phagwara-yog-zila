const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema({
  title: String,
  date: Date,
  time: String,
  day: String,
  place: String,
  mode: { type: String, enum: ['Offline', 'Online'] },
  zoomDetails: String,
  agenda: String,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Saadhak' },
  invitedRoles: [String], // e.g. ['Zila Adhikari', 'Ksheter Adhikari', 'Kender Pramukh', 'Shikshak']
  invitedSaadhaks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Saadhak' }],

  readBy: [{ saadhakId: mongoose.Schema.Types.ObjectId }],
  joiningStatus: [{ saadhakId: mongoose.Schema.Types.ObjectId, joining: Boolean }],

  attendanceMarked: [{ saadhakId: mongoose.Schema.Types.ObjectId }],
  minutes: [
    {
      point: String,
      status: { type: String, enum: ['Completed', 'Carry Forward', 'Pending'], default: 'Pending' }
    }
  ],

  isCompleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Meeting', meetingSchema);
