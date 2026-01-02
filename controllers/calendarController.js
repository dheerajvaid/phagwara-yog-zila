const Saadhak = require("../models/Saadhak");
const cleanupOldGreetings = require("../utils/cleanupOldGreetings");

exports.viewUpcomingEvents = async (req, res) => {
  
  try {
    const { prantRoles } = require("../config/roles");

    const user = req.session.user;    
    
    let saadhakQuery = {};

    if (!user.roles.includes("Admin")) {
      // If user has any Prant role
      const hasPrantRole = user.roles.some((role) => prantRoles.includes(role));

      if (hasPrantRole && user.prant) {
        saadhakQuery = {
          $or: [
            { prant: user.prant },
            { prant: { $exists: false } },
            { prant: null },
          ],
        };
      } else if (user.zila) {
        saadhakQuery = {
          prant: user.prant,
          $or: [
            { zila: user.zila },
            { zila: { $exists: false } },
            { zila: null },
          ],
        };
      } else {
        // No access level found
        saadhakQuery = { _id: null };
      }
    }

    const allSaadhaks = await Saadhak.find(saadhakQuery)
      .populate("kender ksheter zila")
      .lean();

    // Adjust to IST
    const now = new Date();
    const todayIST = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

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

    // Sort function: by date, then type, then name
    const sortEvents = (a, b) => {
      const dateDiff = a.date - b.date;
      if (dateDiff !== 0) return dateDiff;

      const typeOrder = a.type.localeCompare(b.type); // "🎂" comes before "💍"
      if (typeOrder !== 0) return typeOrder;

      return a.saadhak.name.localeCompare(b.saadhak.name);
    };

    todayEvents.sort(sortEvents);
    upcomingEvents.sort(sortEvents);

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
