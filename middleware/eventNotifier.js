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
      $and: [
        {
          $or: [{ dob: { $ne: null } }, { marriageDate: { $ne: null } }],
        },
      ],
    };

    const { prantRoles } = require("../config/roles");

    if (!isAdmin) {
      const hasPrantRole = user.roles.some((role) => prantRoles.includes(role));

      if (hasPrantRole && user.prant) {
        query.$and.push({ prant: user.prant });
      } else if (user.zila) {
        query.$and.push({ zila: user.zila });
      } else {
        query.$and.push({ _id: null }); // blocks everything
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

    console.log(eventCount);

    res.locals.eventCount = eventCount;
    next();
  } catch (err) {
    console.error("Event Count Middleware Error:", err);
    res.locals.eventCount = 0;
    next();
  }
};
