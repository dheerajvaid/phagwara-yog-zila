// models/MeetingAttendance.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const meetingAttendanceSchema = new Schema({
  meeting: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
  saadhak: { type: Schema.Types.ObjectId, ref: 'Saadhak', required: true },
  attended: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('MeetingAttendance', meetingAttendanceSchema);
