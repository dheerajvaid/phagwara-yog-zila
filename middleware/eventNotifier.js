const Saadhak = require("../models/Saadhak");

exports.setEventCount = async (req, res, next) => {
  try {
    if (!req.session.user) {
      res.locals.eventCount = 0;
      return next();
    }

    const today = new Date();
    const day = today.getDate();
    const month = today.getMonth() + 1;

    const query = {
      $or: [
        {
          dob: { $ne: null },
          $expr: {
            $and: [
              { $eq: [{ $dayOfMonth: "$dob" }, day] },
              { $eq: [{ $month: "$dob" }, month] }
            ]
          }
        },
        {
          marriageDate: { $ne: null },
          $expr: {
            $and: [
              { $eq: [{ $dayOfMonth: "$marriageDate" }, day] },
              { $eq: [{ $month: "$marriageDate" }, month] }
            ]
          }
        }
      ]
    };

    const count = await Saadhak.countDocuments(query);
    res.locals.eventCount = count;
    next();
  } catch (err) {
    console.error("Event Count Middleware Error:", err);
    res.locals.eventCount = 0;
    next();
  }
};
