// utils/accessControl.js
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Saadhak = require("../models/Saadhak");
const { adminRoles, prantRoles, zilaRoles, ksheterRoles } = require("../config/roles");

// 🔹 Get accessible Zilas for the user
async function getAccessibleZilas(user) {
  if (user.roles.some((role) => adminRoles.includes(role))) {
    return await Zila.find().sort({ name: 1 });
  }

  if (user.roles.some((role) => prantRoles.includes(role))) {
    return await Zila.find().sort({ name: 1 });
  }
  const saadhak = await Saadhak.findById(user.id).populate("zila");

  if (user.roles.some((role) => zilaRoles.includes(role)) && saadhak.zila) {
    return [saadhak.zila];
  }

  if (user.roles.some((role) => ksheterRoles.includes(role)) && saadhak.zila) {
    return [saadhak.ksheter];
  }

  return [];
}

// 🔹 Get accessible Ksheter for the user
async function getAccessibleKsheters(user) {
  if (user.roles.some((role) => adminRoles.includes(role))) {
    return await Ksheter.find().sort({ name: 1 }).populate("zila");
  }

  const saadhak = await Saadhak.findById(user.id).populate("ksheter").populate("zila");

  if (user.roles.some((role) => zilaRoles.includes(role)) && saadhak.zila) {
    return await Ksheter.find({ zila: saadhak.zila._id }).populate("zila");
  }

  if (user.roles.some((role) => ksheterRoles.includes(role)) && saadhak.ksheter) {
    return [saadhak.ksheter];
  }

  return [];
}

module.exports = {
  getAccessibleZilas,
  getAccessibleKsheters,
};
