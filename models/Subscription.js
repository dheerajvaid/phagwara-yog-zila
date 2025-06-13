const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  subscriberType: {
    type: String,
    enum: ["internal", "external"],
    required: true,
  },

  // Used only if subscriberType is "internal"
  saadhak: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Saadhak",
  },

  // Used only if subscriberType is "external"
  name: String,
  mobile: String,
  address: String,

  zila: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Zila",
    required: true,
  },
  ksheter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Ksheter",
  },
  kender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Kender",
  },

  amount: {
    type: Number,
    default: 0,
    min: [0, 'Amount cannot be negative'],
  },

  numberOfSubscriptions: {
    type: Number,
    default: 0,
    min: [0, "At least 1 subscription is required"],
  },

  year: {
    type: Number,
    required: true,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Saadhak", // The user who entered the subscription
    required: true,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

  deliveryStatus: {
    Q1: { type: String, enum: ["Y", "N", "P"], default: "N" }, // Apr-Jun
    Q2: { type: String, enum: ["Y", "N", "P"], default: "N" }, // Jul-Sep
    Q3: { type: String, enum: ["Y", "N", "P"], default: "N" }, // Oct-Dec
    Q4: { type: String, enum: ["Y", "N", "P"], default: "N" }, // Jan-Mar
  },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
