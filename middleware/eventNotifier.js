const Saadhak = require("../models/Saadhak");

exports.setEventCount = async (req, res, next) => {
  try {
    if (!req.session.user) {
      res.locals.eventCount = 0;
      return next();
    }

    const user = req.session.user;
    const isAdmin = user.roles.includes("Admin");

    // Convert to IST
    const now = new Date();
    const istOffsetMs = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffsetMs);
    const day = istDate.getDate();
    const month = istDate.getMonth() + 1;

    // 🔍 Query conditions
    const query = {
      $or: [
        { dob: { $ne: null } },
        { marriageDate: { $ne: null } }
      ]
    };

    // 🧠 If not admin, filter by user's zila
    if (!isAdmin) {
      query.zila = user.zila;
    }

    const saadhaks = await Saadhak.find(query).select("dob marriageDate maritalStatus");

    let eventCount = 0;

    for (const saadhak of saadhaks) {
      // Birthday check
      if (
        saadhak.dob &&
        saadhak.dob.getDate() === day &&
        saadhak.dob.getMonth() + 1 === month
      ) {
        eventCount++;
      }

      // Anniversary check if married
      if (
        saadhak.maritalStatus === "Married" &&
        saadhak.marriageDate &&
        saadhak.marriageDate.getDate() === day &&
        saadhak.marriageDate.getMonth() + 1 === month
      ) {
        eventCount++;
      }
    }

    res.locals.eventCount = eventCount;
    next();
  } catch (err) {
    console.error("Event Count Middleware Error:", err);
    res.locals.eventCount = 0;
    next();
  }
};
