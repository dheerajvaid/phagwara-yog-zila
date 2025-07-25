const Saadhak = require("../models/Saadhak");

exports.viewUpcomingEvents = async (req, res) => {
  try {
    const allSaadhaks = await Saadhak.find()
      .populate("kender ksheter zila")
      .lean();

    const today = new Date();
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

        const dayDiff = Math.floor((birthdayThisYear - today) / (1000 * 60 * 60 * 24));

        if (bDay === todayDay && bMonth === todayMonth) {
          todayEvents.push({ saadhak: s, type: "🎂 Birthday", date: birthdayThisYear });
        } else if (dayDiff > 0 && dayDiff <= 6) {
          upcomingEvents.push({ saadhak: s, type: "🎂 Birthday", date: birthdayThisYear });
        }
      }

      // Anniversary logic
      if (s.maritalStatus === "Married" && s.marriageDate) {
        const mDate = new Date(s.marriageDate);
        const mDay = mDate.getDate();
        const mMonth = mDate.getMonth();

        const anniversaryThisYear = new Date(today.getFullYear(), mMonth, mDay);

        const dayDiff = Math.floor((anniversaryThisYear - today) / (1000 * 60 * 60 * 24));

        if (mDay === todayDay && mMonth === todayMonth) {
          todayEvents.push({ saadhak: s, type: "💍 Anniversary", date: anniversaryThisYear });
        } else if (dayDiff > 0 && dayDiff <= 6) {
          upcomingEvents.push({ saadhak: s, type: "💍 Anniversary", date: anniversaryThisYear });
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
