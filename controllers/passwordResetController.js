// =================== CONTROLLER: passwordResetController.js ===================

const Saadhak = require("../models/Saadhak");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");

const { ALL_ROLES } = require("../utils/roles");
const { all } = require("../routes/kenderRoutes");

// GET: List all Saadhaks
exports.getAllSaadhaks = async (req, res) => {
  try {
    const user = req.session.user;

    let query = {};

    if (!user.roles.includes("Admin")) {
      if (
        user.roles.includes("Zila Pradhan") ||
        user.roles.includes("Zila Mantri")
      ) {
        query.zila = user.zila;
      }
      if (
        user.roles.includes("Ksheter Pradhan") ||
        user.roles.includes("Ksheter Mantri")
      ) {
        query.ksheter = user.ksheter;
      }
      if (
        user.roles.includes("Kender Pramukh") ||
        user.roles.includes("Seh Kender Pramukh")
      ) {
        query.kender = user.kender;
      }
    }

    const saadhaks = await Saadhak.find(query)
      .populate("zila")
      .populate("ksheter")
      .populate("kender")
      .sort({ name: 1 });

    const zilas = await Zila.find().sort({ name: 1 });
    const ksheters = await Ksheter.find().sort({ name: 1 });
    const kenders = await Kender.find().sort({ name: 1 });

    res.render('resetPassword/list', { saadhaks });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching Saadhaks");
  }
};

// POST: Reset password
exports.resetPassword = async (req, res) => {
  try {
    
    const saadhakId = req.params.id;
    await Saadhak.findByIdAndUpdate(saadhakId, {
      password: null,
      passwordCreated: false, // Optional: if you're tracking it
    });
    res.redirect("/reset-password/list?success=1");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error resetting password");
  }
};
