const Saadhak = require("../models/Saadhak");

exports.setEventCount = async (req, res, next) => {
  try {
    if (!req.session.user) {
      res.locals.eventCount = 0;
      return next();
    }

    const user = req.session.user;
    const isAdmin = user.roles.includes("Admin");

    // ✅ Get current IST date and time accurately
    const now = new Date();
    const istNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );
    const day = istNow.getDate();
    const month = istNow.getMonth() + 1;

    // 🔍 Query conditions
    const query = {
      $or: [{ dob: { $ne: null } }, { marriageDate: { $ne: null } }],
    };

    const { prantRoles } = require("../config/roles");

    if (!isAdmin) {
      const hasPrantRole = user.roles.some((role) => prantRoles.includes(role));

      if (hasPrantRole && user.prant) {
        query.$or.push(
          { prant: user.prant },
          { prant: { $exists: false } },
          { prant: null }
        );
      } else if (user.zila) {
        query.$or.push(
          { zila: user.zila },
          { zila: { $exists: false } },
          { zila: null }
        );
      } else {
        // No access level: block all
        query._id = null;
      }
    }

    const saadhaks = await Saadhak.find(query).select(
      "dob marriageDate maritalStatus"
    );

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
