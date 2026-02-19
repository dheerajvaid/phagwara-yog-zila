const mongoose = require("mongoose");

const AllowedDaysSchema = new mongoose.Schema({
  days: {
    type: Number,
    required: true,
    default: 3,    
  },  
});

module.exports = mongoose.models.AllowedDays || mongoose.model('AllowedDays', AllowedDaysSchema);
