// models/MeetingResponse.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const meetingResponseSchema = new Schema({
  meeting: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
  saadhak: { type: Schema.Types.ObjectId, ref: 'Saadhak', required: true },
  hasReadAgenda: { type: Boolean, default: false },
  isJoining: { type: String, enum: ['Yes', 'No', 'Pending'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('MeetingResponse', meetingResponseSchema);
