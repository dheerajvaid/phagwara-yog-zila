const Saadhak = require("../models/Saadhak");
const cleanupOldGreetings = require("../utils/cleanupOldGreetings");

exports.viewUpcomingEvents = async (req, res) => {
  try {
    // Clean up old greetings
    cleanupOldGreetings(); // no await since it's async with callbacks
  } catch (cleanupErr) {
    console.error("Cleanup failed:", cleanupErr);
  }

  try {
    const user = req.session.user;
    let saadhakQuery = {};

    if (!user.roles.includes("Admin")) {
      if (user.zila) {
        saadhakQuery.zila = user.zila;
      } else {
        // if user has no zila (edge case), show nothing
        saadhakQuery = { _id: null };
      }
    }

    const allSaadhaks = await Saadhak.find(saadhakQuery)
      .populate("kender ksheter zila")
      .lean();

    // Adjust to IST
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // +5:30 in ms
    const todayIST = new Date(now.getTime() + istOffset);

    const today = new Date(
      todayIST.getFullYear(),
      todayIST.getMonth(),
      todayIST.getDate()
    );
    const todayDay = today.getDate();
    const todayMonth = today.getMonth(); // 0-indexed

    const upcomingEvents = [];
    const todayEvents = [];

    for (const s of allSaadhaks) {
      // Birthday logic
      if (s.dob) {
        const dob = new Date(s.dob);
        const bDay = dob.getDate();
        const bMonth = dob.getMonth();

        const birthdayThisYear = new Date(today.getFullYear(), bMonth, bDay);
        const dayDiff = Math.floor(
          (birthdayThisYear - today) / (1000 * 60 * 60 * 24)
        );

        if (bDay === todayDay && bMonth === todayMonth) {
          todayEvents.push({
            saadhak: s,
            type: "🎂 Birthday",
            date: birthdayThisYear,
          });
        } else if (dayDiff > 0 && dayDiff <= 6) {
          upcomingEvents.push({
            saadhak: s,
            type: "🎂 Birthday",
            date: birthdayThisYear,
          });
        }
      }

      // Anniversary logic
      if (s.maritalStatus === "Married" && s.marriageDate) {
        const mDate = new Date(s.marriageDate);
        const mDay = mDate.getDate();
        const mMonth = mDate.getMonth();

        const anniversaryThisYear = new Date(today.getFullYear(), mMonth, mDay);
        const dayDiff = Math.floor(
          (anniversaryThisYear - today) / (1000 * 60 * 60 * 24)
        );

        if (mDay === todayDay && mMonth === todayMonth) {
          todayEvents.push({
            saadhak: s,
            type: "💍 Anniversary",
            date: anniversaryThisYear,
          });
        } else if (dayDiff > 0 && dayDiff <= 6) {
          upcomingEvents.push({
            saadhak: s,
            type: "💍 Anniversary",
            date: anniversaryThisYear,
          });
        }
      }
    }

    res.render("calendar/upcoming", {
      title: "Today & Upcoming Events",
      todayEvents,
      upcomingEvents,
    });
  } catch (err) {
    console.error("Error in event logic:", err);
    res.status(500).send("Something went wrong");
  }
};
