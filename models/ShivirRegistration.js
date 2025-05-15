const mongoose = require('mongoose');

const shivirRegistrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  mobile: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female'], required: true },
  age: { type: Number, required: true },
  address: { type: String, required: true },
  disease: { type: String }, // Optional field
  bysMember: { type: String, enum: ['Yes', 'No'], required: true }, // Yes/No required
  registeredAt: { type: Date, default: Date.now },
  kenderName: { type: String, default: 'Urban Avenue, Phagwara' }
});

module.exports = mongoose.model('ShivirRegistration', shivirRegistrationSchema);
