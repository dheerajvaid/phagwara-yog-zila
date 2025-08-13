const mongoose = require('mongoose');
const slugify = require('slugify');

const ProgramSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, index: true },
  description: String,
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  startTime: String,
  endTime: String,
  venue: String,
  capacity: { type: Number, default: 0 },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: 'Saadhak', required: true },
  attachments: [String],
  status: { type: String, enum: ['draft','published','cancelled'], default: 'draft' },
  registrationOpen: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },

  // Existing allowed arrays
  allowedPrants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Prant' }],
  allowedZilas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Zila' }],
  allowedKsheters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ksheter' }],
  allowedKenders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Kender' }],

  // NEW: define which levels can register
  allowedLevels: [{ 
    type: String, 
    enum: ['prant','zila','ksheter','kender','saadhak'], 
    required: true 
  }],

  registeredUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],

  public: { type: Boolean, default: false },
});

ProgramSchema.pre('save', function(next) {
  if (!this.slug) this.slug = slugify(this.title || '', { lower: true, strict: true });
  this.updatedAt = new Date();
  next();
});


ProgramSchema.index({ startDate: 1 });

module.exports = mongoose.model('Program', ProgramSchema);
