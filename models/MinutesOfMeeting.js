// models/MinutesOfMeeting.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const momSchema = new Schema({
  meeting: { type: Schema.Types.ObjectId, ref: 'Meeting', required: true },
  agendaPoint: { type: String, required: true },
  status: { type: String, enum: ['Covered', 'Not Covered', 'Carry Forward'], default: 'Not Covered' },
  notes: { type: String }
});

module.exports = mongoose.model('MinutesOfMeeting', momSchema);
