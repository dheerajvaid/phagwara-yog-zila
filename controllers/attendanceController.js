const Prant = require("../models/Prant");
const Saadhak = require("../models/Saadhak");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const Attendance = require("../models/Attendance");
const messages = require("../utils/motivationalMessages");
const pdfExport = require("../utils/pdfExport");
const roleConfig = require("../config/roles");
const roles = roleConfig;
const ExcelJS = require("exceljs");
const mongoose = require("mongoose");

const {
  adminRoles,
  prantRoles,
  zilaRoles,
  ksheterRoles,
  kenderRoles,
  kenderTeamRoles,
  saadhakRoles,
} = roleConfig;

// Show attendance marking form
exports.showMarkAttendanceForm = async (req, res) => {
  try {
    const user = req.session.user;

    const now = new Date();
    const istNow = new Date(
      now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
    );

    // Set to IST 00:00
    const today = new Date(
      istNow.getFullYear(),
      istNow.getMonth(),
      istNow.getDate()
    );

    const start = new Date(today);
    start.setHours(0, 0, 0, 0); // today at 00:00:00

    const end = new Date(today);
    end.setHours(23, 59, 59, 999); // today at 23:59:59.999

    let query = {};

    if (!user.roles.includes("Admin")) {
      if (user.roles.some((role) => zilaRoles.includes(role))) {
        query.zila = user.zila;
      }
      if (user.roles.some((role) => ksheterRoles.includes(role))) {
        query.ksheter = user.ksheter;
      }
      if (
        user.roles.some((role) => kenderRoles.includes(role)) ||
        user.roles.some((role) => kenderTeamRoles.includes(role))
      ) {
        query.$or = [
          { kender: user.kender }, // Kender team
          { zila: user.zila, role: { $in: ksheterRoles } }, // Ksheter team
          { zila: user.zila, role: { $in: zilaRoles } }, // Zila team
          { prant: user.prant, role: { $in: prantRoles } },
        ];
      }
      if (user.roles.some((role) => saadhakRoles.includes(role))) {
        query._id = user.id;
      }
    }

    const saadhaks = await Saadhak.find(query)
      .populate("zila")
      .populate("ksheter")
      .populate("kender")
      .sort({ name: 1 })
      .lean(); // Make sure we can attach properties

    const zilas = !user.zila
      ? await Zila.find().sort({ name: 1 })
      : await Zila.find({ _id: user.zila }).sort({ name: 1 });
    const ksheters = !user.ksheter
      ? await Ksheter.find().sort({ name: 1 })
      : await Ksheter.find({ _id: user.ksheter }).sort({ name: 1 });
    const kenders = !user.kender
      ? await Kender.find().sort({ name: 1 })
      : await Kender.find({ _id: user.kender }).sort({ name: 1 });

    const todaysAttendance = await Attendance.find({
      date: { $gte: start, $lte: end },
      kender: user.kender,
      status: "Present",
    }).select("saadhak");

    const markedSaadhakIds = todaysAttendance.map((a) => a.saadhak.toString());

    // ✅ Add monthly attendance dates to each saadhak
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    monthStart.setHours(0, 0, 0, 0);
    monthEnd.setHours(24, 0, 0, 0);

    // const totalDays = await Attendance.distinct("date", {
    //   date: { $gte: monthStart, $lt: monthEnd },
    // });

    // for (let saadhak of saadhaks) {
    //   const monthlyAttendance = await Attendance.find({
    //     saadhak: saadhak._id,
    //     date: { $gte: monthStart, $lt: monthEnd },
    //     status: "Present",
    //   })
    //     .select("date")
    //     .lean();

    //   saadhak.attendanceDates = monthlyAttendance.map((a) => a.date);
    // }

    // Step 1: Get all saadhak IDs
    // console.log(saadhaks);
    const saadhakIds = saadhaks.map((saadhak) => saadhak._id);

    // Step 1: Fetch all attendance records for the selected saadhaks at once
    const allAttendance = await Attendance.find({
      saadhak: { $in: saadhakIds },
      date: { $gte: monthStart, $lt: monthEnd },
      status: "Present",
    })
      .select("saadhak date") // Select saadhak and date fields
      .lean();

    // Log to check if data is being fetched
    // console.log("Fetched Attendance Data:", allAttendance);

    // Step 2: Group attendance data by saadhak
    const attendanceBySaadhak = {};

    for (let a of allAttendance) {
      const id = a.saadhak.toString(); // Group by saadhak ID
      if (!attendanceBySaadhak[id]) attendanceBySaadhak[id] = [];
      a.date.setHours(10, 0, 0, 0);
      attendanceBySaadhak[id].push(a.date);
    }

    // Log grouped data
    // console.log("Grouped Attendance Data:", attendanceBySaadhak);

    // Step 3: Assign the grouped attendance dates to the saadhaks

    for (let saadhak of saadhaks) {
      // const rawDates = attendanceBySaadhak[saadhak._id.toString()] || [];

      // saadhak.attendanceDates = [
      //   ...new Set(rawDates.map((date) => new Date(date).toDateString())),
      // ];
      saadhak.attendanceDates =
        attendanceBySaadhak[saadhak._id.toString()] || []; // Default to empty array if no attendance found
      // console.log(saadhak.name + " " + saadhak.attendanceDates);
    }

    // Log final result
    // console.log("Updated Saadhaks with Attendance Dates:", saadhaks);
    const saadhaksWithAttendance = [];
    const saadhaksWithoutAttendance = [];

    for (let saadhak of saadhaks) {
      if (saadhak.attendanceDates && saadhak.attendanceDates.length > 0) {
        saadhaksWithAttendance.push(saadhak);
      } else {
        saadhaksWithoutAttendance.push(saadhak);
      }
    }

    // Sort both groups alphabetically by name
    saadhaksWithAttendance.sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" })
    );
    saadhaksWithoutAttendance.sort((a, b) =>
      a.name.localeCompare(b.name, "en", { sensitivity: "base" })
    );

    // Merge the two groups
    const sortedSaadhaks = [
      ...saadhaksWithAttendance,
      ...saadhaksWithoutAttendance,
    ];

    // console.log(zilaRoles);

    // Now render the view with the sorted list
    res.render("attendance/mark", {
      saadhaks: sortedSaadhaks,
      zilas,
      ksheters,
      kenders,
      user,
      markedSaadhakIds,
      prantRoles,
      zilaRoles,
      ksheterRoles,
      // totalDaysCount: totalDays.length,
    });
  } catch (err) {
    console.error("❌ Error listing Saadhaks:", err);
    res.status(500).send("Server Error");
  }
};

// Handle attendance submission
exports.markAttendance = async (req, res) => {
  try {
    const user = req.session.user;

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    let selectedSaadhaks = req.body.selectedSaadhaks;
    // const selectedKender = req.body.kenderFilter;
    // console.log(selectedKender);
    // console.log(selectedSaadhaks);

    const attendanceDate = new Date(req.body.attendanceDate);
    attendanceDate.setHours(10, 0, 0, 0);

    const start = new Date(attendanceDate);
    start.setHours(0, 0, 0, 0); // today at 00:00:00

    const end = new Date(attendanceDate);
    end.setHours(24, 0, 0, 0); // today at 23:59:59.999

    if (!selectedSaadhaks) {
      selectedSaadhaks = []; // No saadhaks selected means delete all attendance for today
    }

    if (!Array.isArray(selectedSaadhaks)) {
      selectedSaadhaks = [selectedSaadhaks];
    }

    // console.log(start, " - ", end);
    if (user.roles.includes("Saadhak")) {
      await Attendance.deleteOne({
        saadhak: user.id,
        kender: req.body.selectedKender,
        date: { $gte: start, $lt: end },
      });
    } else {
      await Attendance.deleteMany({
        kender: req.body.selectedKender,
        date: { $gte: start, $lt: end },
      });
    }
    // console.log("reached at 7");

    const records = selectedSaadhaks.map((id) => ({
      saadhak: id,
      kender: req.body.selectedKender,
      date: attendanceDate,
      status: "Present", // or whatever your schema requires
    }));

    // console.log("reached at 8 and kender is " + selectedKender);

    if (records.length > 0) {
      await Attendance.insertMany(records);
    }

    // for (let saadhakId of selectedSaadhaks) {
    //   const existingAttendance = await Attendance.findOne({
    //     saadhak: saadhakId,
    //     date: { $gte: start, $lte: end },
    //   });

    //   if (existingAttendance) {
    //     existingAttendance.status = "Present";
    //     await existingAttendance.save();
    //   } else {
    //     const attendance = new Attendance({
    //       saadhak: saadhakId,
    //       date: attendanceDate,
    //       status: "Present",
    //     });
    //     await attendance.save();
    //   }
    // }

    // // 2. Remove attendance records for today where saadhak is NOT in selectedSaadhaks
    // await Attendance.deleteMany({
    //   date: { $gte: start, $lte: end },
    //   saadhak: { $nin: selectedSaadhaks },
    // });

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    req.flash("message", randomMessage);

    const formattedDate = attendanceDate.toISOString().split("T")[0]; // YYYY-MM-DD format
    res.redirect(`/attendance/today?date=${formattedDate}`);
  } catch (err) {
    console.error("Error marking attendance:", err);
    res.status(500).send("Server Error");
  }
};

// Show today's attendance
exports.viewTodayAttendance = async (req, res) => {
  try {
    const user = req.session.user;
    // Always get today's date in India timezone
    const todayIndia = new Date()
      .toLocaleString("en-CA", { timeZone: "Asia/Kolkata" })
      .split(",")[0];

    const selectedDate = req.query.date
      ? new Date(req.query.date)
      : new Date(todayIndia);

    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    let attendanceRecords = await Attendance.find({
      date: { $gte: start, $lte: end },
      status: "Present",
      kender: user.kender,
    }).populate("saadhak");

    attendanceRecords = attendanceRecords.filter((record) => {
      return record.saadhak && record.saadhak.name;
    });

    attendanceRecords.sort((a, b) => {
      const nameA = a.saadhak.name.toLowerCase();
      const nameB = b.saadhak.name.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    const kender = await Kender.findById(user.kender);
    const pramukhs = await Saadhak.find({
      kender: user.kender,
      role: { $in: ["Kender Pramukh", "Seh Kender Pramukh"] },
    }).select("name mobile role");

    let kenderPramukh = null;
    let sehKenderPramukh = [];

    pramukhs.forEach((p) => {
      if (p.role[0] === "Kender Pramukh") {
        kenderPramukh = p;
      } else if (p.role[0] === "Seh Kender Pramukh") {
        sehKenderPramukh.push(p);
      }
    });

    let ksheterPradhan = null;
    let ksheterMantri = null;

    if (user.ksheter) {
      const ksheterTeam = await Saadhak.find({
        ksheter: user.ksheter,
        role: { $in: ["Ksheter Pradhan", "Ksheter Mantri"] },
      }).select("name mobile role");

      ksheterTeam.forEach((member) => {
        if (member.role.includes("Ksheter Pradhan")) ksheterPradhan = member;
        if (member.role.includes("Ksheter Mantri")) ksheterMantri = member;
      });
    }

    let ksheterName = "";

    if (user.ksheter) {
      const ksheter = await Ksheter.findById(user.ksheter).select("name");
      if (ksheter) ksheterName = ksheter.name;
    }

    let zilaPradhan = null;
    let zilaMantri = null;
    let zilaSangathanMantri = null;
    let zilaCashier = null;

    if (user.zila) {
      const zilaTeam = await Saadhak.find({
        zila: user.zila,
        role: { $in: [...roleConfig.zilaRoles] },
      }).select("name mobile role");

      zilaTeam.forEach((member) => {
        if (member.role.includes("Zila Pradhan")) zilaPradhan = member;
        if (member.role.includes("Zila Mantri")) zilaMantri = member;
        if (member.role.includes("Zila Sangathan Mantri"))
          zilaSangathanMantri = member;
        if (member.role.includes("Zila Cashier")) zilaCashier = member;
      });
    }

    let zilaName = "";

    if (user.zila) {
      const zila = await Zila.findById(user.zila).select("name");
      if (zila) zilaName = zila.name;
    }

    // ✅ Monthly attendance strip logic (using same concept as viewKenderWiseAttendance)
    const startOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    const endOfMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    // Fetch attendance of this Kender for the full month
    const kenderMonthlyRecords = await Attendance.find({
      kender: user.kender,
      status: "Present",
      date: { $gte: startOfMonth, $lte: endOfMonth },
    }).select("date");

    // 📅 Build date → count map
    const dateCountMap = {};

    kenderMonthlyRecords.forEach((record) => {
      const day = record.date.getDate(); // 1-31
      dateCountMap[day] = (dateCountMap[day] || 0) + 1;
    });

    // 📊 Build monthlyAttendanceStrip for display
    const totalDaysInMonth = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    ).getDate();
    const monthlyAttendanceStrip = [];

    for (let i = 1; i <= totalDaysInMonth; i++) {
      monthlyAttendanceStrip.push({
        day: i,
        count: dateCountMap[i] || 0,
      });
    }

    // 🔢 Step: Get attendance count per Saadhak for the current month
    const saadhakIds = attendanceRecords.map((r) => r.saadhak._id);

    // Count attendance per Saadhak in this month
    const attendanceCounts = await Attendance.aggregate([
      {
        $match: {
          saadhak: { $in: saadhakIds },
          status: "Present",
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: "$saadhak",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convert to map for quick lookup
    const attendanceMap = {};
    attendanceCounts.forEach((item) => {
      attendanceMap[item._id.toString()] = item.count;
    });

    // 🧩 Add monthly count to each saadhak record
    attendanceRecords = attendanceRecords.map((r) => {
      return {
        ...r.toObject(),
        monthlyCount: attendanceMap[r.saadhak._id.toString()] || 0,
      };
    });

    res.render("attendance/today", {
      saadhaks: attendanceRecords,
      message:
        attendanceRecords.length === 0
          ? "No attendance marked for selected date"
          : "",
      zilaName: zilaName || "",
      zilaPradhan: zilaPradhan || "",
      zilaMantri: zilaMantri || "",
      zilaSangathanMantri: zilaSangathanMantri || "",
      zilaCashier: zilaCashier || "",
      kenderName: kender.name,
      kenderAddress: kender.address,
      kenderPramukh: kenderPramukh || {},
      sehKenderPramukh: sehKenderPramukh || {},
      ksheterPradhan: ksheterPradhan || {},
      ksheterMantri: ksheterMantri || {},
      ksheterName: ksheterName || "",
      attendanceDateFormatted: selectedDate.toLocaleDateString("en-IN"),
      attendanceDate: selectedDate.toISOString().split("T")[0],
      randomMessage: messages[Math.floor(Math.random() * messages.length)],
      startTime: kender.startTime || null,
      monthlyAttendanceStrip, // 👈 NEW line added safely
    });
  } catch (err) {
    console.error("Error fetching attendance:", err);
    res.status(500).send("Server Error");
  }
};

// View attendance by specific date
exports.viewAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.render("attendance/by-date", {
        attendance: [],
        selectedDate: null,
      });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({ date: targetDate }).populate(
      "saadhak"
    );
    res.render("attendance/by-date", { attendance, selectedDate: date });
  } catch (err) {
    console.error("Error viewing attendance by date:", err);
    res.status(500).send("Server Error");
  }
};

// Show attendance report for a specific date
exports.showAttendanceReport = async (req, res) => {
  const date = req.params.date;
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  try {
    const attendanceRecords = await Attendance.find({ date: day }).populate(
      "saadhak"
    );

    if (attendanceRecords.length === 0) {
      return res.render("attendance/today", {
        saadhaks: [],
        message: "No attendance marked for today",
      });
    }

    res.render("attendance/report", { attendanceRecords });
  } catch (err) {
    console.error("Error fetching attendance report:", err);
    res.status(500).send("Server Error");
  }
};

// Show attendance report filtered by Kender
exports.reportByKender = async (req, res) => {
  const kenderId = req.params.kenderId;

  try {
    const saadhaks = await Saadhak.find({ kender: kenderId });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRecords = await Attendance.find({
      saadhak: { $in: saadhaks.map((s) => s._id) },
      date: today,
    }).populate("saadhak");

    res.render("attendance/kenderReport", {
      attendanceRecords,
      date: today.toISOString().split("T")[0],
    });
  } catch (err) {
    console.error("Error loading kender report:", err);
    res.status(500).send("Server Error");
  }
};

// Full report for a date (all saadhaks)
exports.fullReportByDate = async (req, res) => {
  const date = req.params.date;
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  try {
    const attendanceRecords = await Attendance.find({ date: day }).populate({
      path: "saadhak",
      populate: { path: "kender", select: "name" },
    });

    res.render("attendance/fullReport", {
      attendanceRecords,
      date,
    });
  } catch (err) {
    console.error("Error loading full report:", err);
    res.status(500).send("Server Error Full Report");
  }
};

// Show filter form
exports.filteredAttendanceForm = async (req, res) => {
  const kenders = await Kender.find();
  res.render("attendance/filter", { kenders });
};

// Handle filter results
exports.filteredAttendanceResult = async (req, res) => {
  const { date, kender } = req.body;
  const query = {};

  if (date) {
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    query.date = day;
  }

  if (kender) {
    const saadhaks = await Saadhak.find({ kender });
    const saadhakIds = saadhaks.map((s) => s._id);
    query.saadhak = { $in: saadhakIds };
  }

  const records = await Attendance.find(query).populate("saadhak");
  res.render("attendance/filteredResult", { records, date, kender });
};

exports.getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const user = req.session.user;

    if (!date || !user.kender) {
      return res.status(400).json({ error: "Invalid date or kender." });
    }

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const attendance = await Attendance.find({
      date: { $gte: selectedDate, $lt: nextDay },
      kender: user.kender,
      status: "Present",
    }).select("saadhak");

    const markedIds = attendance.map((a) => a.saadhak.toString());

    res.json({ markedSaadhakIds: markedIds });
  } catch (err) {
    console.error("Error in getAttendanceByDate:", err);
    res.status(500).json({ error: "Something went wrong." });
  }
};

exports.viewAttendance = async (req, res) => {
  try {
    const { kender, month, year, sortBy } = req.query;
    const user = req.session.user;
    const userRoles = user.roles;
    const today = new Date();
    const selectedMonth = parseInt(req.query.month) || today.getMonth() + 1; // 1–12
    const selectedYear = parseInt(req.query.year) || today.getFullYear();
    const kenderFilter = {};

    let attendanceData = [];
    let saadhaks = [];
    let daysInMonth = 0;
    let activeDaysArray = [];
    let { roleType } = req.query || "";

    if (kender && month && year) {
      const start = new Date(`${selectedYear}-${selectedMonth}-01`);
      const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59); // last day of month

      if (
        roleType == "adhikari" &&
        userRoles.some((role) => prantRoles.includes(role))
      ) {
        delete kenderFilter.kender;
        delete kenderFilter.ksheter;
        delete kenderFilter.zila;
        kenderFilter.prant = user.prant;
        kenderFilter.role = { $in: [...prantRoles, ...zilaRoles] };
      } else if (
        roleType == "adhikari" &&
        userRoles.some((role) => zilaRoles.includes(role))
      ) {
        delete kenderFilter.kender;
        delete kenderFilter.ksheter;
        kenderFilter.zila = user.zila;
        kenderFilter.prant = user.prant;
        kenderFilter.role = {
          $in: [...zilaRoles, ...ksheterRoles, ...kenderRoles],
        };
      } else if (
        roleType == "adhikari" &&
        userRoles.some((role) => ksheterRoles.includes(role))
      ) {
        delete kenderFilter.kender;
        kenderFilter.ksheter = user.ksheter;
        kenderFilter.zila = user.zila;
        kenderFilter.prant = user.prant;
        kenderFilter.role = { $in: [...ksheterRoles, ...kenderRoles] };
      } else {
        if (kender) kenderFilter.kender = kender;
        if (user.prant) kenderFilter.prant = user.prant;
        if (user.zila) kenderFilter.zila = user.zila;
        if (user.ksheter) kenderFilter.ksheter = user.ksheter;
        if (user.kender) kenderFilter.kender = user.kender;
      }

      saadhaks = await Saadhak.find({ ...kenderFilter });

      let attendanceRecords;

      if (roleType === "adhikari") {
        attendanceRecords = await Attendance.aggregate([
          {
            $match: {
              date: { $gte: start, $lte: end },
            },
          },
          {
            $group: {
              _id: {
                saadhak: "$saadhak",
                day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
              },
              firstRecord: { $first: "$$ROOT" },
            },
          },
          {
            $replaceRoot: { newRoot: "$firstRecord" },
          },
          { $sort: { date: 1 } },
        ]);
      } else {
        attendanceRecords = await Attendance.find({
          kender,
          date: { $gte: start, $lte: end },
        });
      }

      // 🔥 INCLUDE ADHIKARI WHO ATTENDED THIS KENDER BUT DON'T BELONG TO THIS KENDER
      if (roleType !== "adhikari") {
        const adhikariPresentIds = await Attendance.find({
          kender,
          date: { $gte: start, $lte: end },
        }).distinct("saadhak");

        const extraSaadhaks = await Saadhak.find({
          _id: { $in: adhikariPresentIds },
        });

        const merged = new Map();
        [...saadhaks, ...extraSaadhaks].forEach((s) => {
          merged.set(s._id.toString(), s);
        });
        saadhaks = Array.from(merged.values());
      }
      // 🔥 END OF EXTRA ADDITION

      // Map attendance
      const attendanceMap = {};
      attendanceRecords.forEach((record) => {
        if (!attendanceMap[record.saadhak]) {
          attendanceMap[record.saadhak] = [];
        }
        attendanceMap[record.saadhak].push(
          record.date.toISOString().split("T")[0]
        );
      });

      // Final data (remove 0-present people)
      attendanceData = saadhaks
        .map((s) => {
          const attendance = attendanceMap[s._id.toString()] || [];
          return {
            _id: s._id,
            name: s.name,
            attendance,
            presentCount: attendance.length,
          };
        })
        .filter((s) => s.presentCount > 0);

      // Sorting
      if (sortBy === "count") {
        attendanceData.sort((a, b) => {
          if (b.presentCount === a.presentCount) {
            return a.name.localeCompare(b.name);
          }
          return b.presentCount - a.presentCount;
        });
      } else {
        attendanceData.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Determine active days
      const activeDays = new Set();
      attendanceData.forEach((s) => {
        s.attendance.forEach((dateStr) => {
          const day = parseInt(dateStr.split("-")[2]);
          activeDays.add(day);
        });
      });

      activeDaysArray = Array.from(activeDays).sort((a, b) => a - b);

      daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    }

    let selectedKenderName = "";

    if (roleType !== "adhikari") {
      if (kender) {
        const selectedKenderData = await Kender.findById(kender);
        selectedKenderName = selectedKenderData?.name || "";
      } else {
        const selectedKenderData = await Kender.findById(user.kender);
        selectedKenderName = selectedKenderData?.name || "";
      }
    }

    res.render("attendance/view", {
      selectedKender: kender || user.kender,
      selectedKenderName: selectedKenderName || "",
      selectedMonth,
      selectedYear,
      attendanceData,
      saadhaks,
      daysInMonth,
      sortBy,
      activeDays: activeDaysArray,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.viewKenderWiseAttendance = async (req, res) => {
  try {
    const user = req.session.user;
    const today = new Date();
    const selectedMonth = parseInt(req.query.month) || today.getMonth() + 1;
    const selectedYear = parseInt(req.query.year) || today.getFullYear();
    const sortBy = req.query.sortBy || "name";

    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    // -------------------------------
    // 🔹 Normalize Filters
    // -------------------------------
    const normalizeScopeValue = (value) => {
      if (!value) return "";
      if (Array.isArray(value)) return value[0] || "";
      return String(value);
    };

    const prantQuery = normalizeScopeValue(req.query.prant).trim();
    const zilaQuery = normalizeScopeValue(req.query.zila).trim();
    const ksheterQuery = normalizeScopeValue(req.query.ksheter).trim();
    const kenderQuery = normalizeScopeValue(req.query.kender).trim();

    // 🛡️ Require prant & zila ONLY when filters are used
    if (Object.keys(req.query).length > 0) {
      if (!prantQuery || !zilaQuery) {
        const referer = req.get("Referer");
        const backUrl = referer
          ? referer.split("?")[0]
          : "/attendance/view-kender";

        return res.status(400).render("error/error-page", {
          title: "Invalid Request",
          message: "Both Prant and Zila are required to view attendance.",
          backUrl,
        });
      }
    }

    // -------------------------------
    // 🔹 Build Kender Filter
    // -------------------------------
    const kenderFilter = {};

    if (kenderQuery) {
      kenderFilter._id = kenderQuery;
    } else if (ksheterQuery) {
      kenderFilter.ksheter = ksheterQuery;
      kenderFilter.zila = zilaQuery;
      kenderFilter.prant = prantQuery;
    } else if (zilaQuery) {
      kenderFilter.zila = zilaQuery;
      kenderFilter.prant = prantQuery;
    } else if (user.kender) {
      kenderFilter._id = user.kender;
    } else {
      if (user.zila) kenderFilter.zila = user.zila;
      if (user.ksheter) kenderFilter.ksheter = user.ksheter;
      if (user.prant) kenderFilter.prant = user.prant;
    }

    const selectedPrant = prantQuery || user.prant?.toString() || "";
    const selectedZila = zilaQuery || user.zila?.toString() || "";
    const selectedKsheter = ksheterQuery || user.ksheter?.toString() || "";
    const selectedKender = kenderQuery || user.kender?.toString() || "";

    // -------------------------------
    // 🔹 Fetch Kenders
    // -------------------------------
    const allKenders = await Kender.find(kenderFilter)
      .populate("ksheter")
      .sort("name");

    let attendanceData = [];
    let activeDaysArray = [];
    let kenderDateCountMap = {};

    // -------------------------------
    // 🔹 Load Attendance Only When Month+Year Selected
    // -------------------------------
    if (req.query.month && req.query.year) {
      const kenderIds = allKenders.map((k) => k._id.toString());

      const attendanceRecords = await Attendance.find({
        kender: { $in: kenderIds },
        date: { $gte: start, $lte: end },
      }).populate("kender");

      // 🟢 Build kenderDateCountMap
      attendanceRecords.forEach((record) => {
        const kId = record.kender?._id?.toString();
        const dateStr = record.date.toISOString().split("T")[0];

        if (!kenderDateCountMap[kId]) kenderDateCountMap[kId] = {};
        if (!kenderDateCountMap[kId][dateStr])
          kenderDateCountMap[kId][dateStr] = 0;

        kenderDateCountMap[kId][dateStr]++;
      });

      // -------------------------------
      // 🔹 Prepare attendanceData
      // -------------------------------
      attendanceData = allKenders
        .map((k) => {
          const attendanceObj = kenderDateCountMap[k._id.toString()] || {};
          const presentCount = Object.values(attendanceObj).reduce(
            (sum, v) => sum + v,
            0
          );

          return {
            _id: k._id,
            name: k.name,
            attendance: Object.keys(attendanceObj),
            presentCount,
            ksheter: k.ksheter,
          };
        })
        .filter((k) => k.presentCount > 0);

      // Sorting
      if (sortBy === "count") {
        attendanceData.sort((a, b) => {
          if (b.presentCount === a.presentCount)
            return a.name.localeCompare(b.name);
          return b.presentCount - a.presentCount;
        });
      } else {
        attendanceData.sort((a, b) => a.name.localeCompare(b.name));
      }

      // -------------------------------
      // 🔹 Active Days (1–31)
      // -------------------------------
      const activeDays = new Set();
      Object.values(kenderDateCountMap).forEach((dateMap) => {
        Object.keys(dateMap).forEach((dateStr) => {
          const day = parseInt(dateStr.split("-")[2]);
          activeDays.add(day);
        });
      });

      activeDaysArray = Array.from(activeDays).sort((a, b) => a - b);
    }

    // We now remove vertical completely:
    const viewMode = "horizontal";

    // -------------------------------
    // 🔵 GROUP KENDERS BY KSHTER WITH TOTALS
    // -------------------------------
    const groupedByKsheter = {};
    const ksheterDayTotals = {};

    attendanceData.forEach((k) => {
      const ksheterName = k.ksheter?.name || "Unknown";

      if (!groupedByKsheter[ksheterName]) {
        groupedByKsheter[ksheterName] = [];
        ksheterDayTotals[ksheterName] = {};
        activeDaysArray.forEach((d) => (ksheterDayTotals[ksheterName][d] = 0));
      }

      groupedByKsheter[ksheterName].push(k);

      const kId = k._id.toString();

      activeDaysArray.forEach((day) => {
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        const count =
          (kenderDateCountMap[kId] && kenderDateCountMap[kId][dateStr]) || 0;

        ksheterDayTotals[ksheterName][day] += count;
      });
    });

    // -------------------------------
    // 🔹 Render View
    // -------------------------------
    res.render("attendance/view-kender", {
      allKenders,
      selectedMonth,
      selectedYear,
      sortBy,
      attendanceData,
      activeDays: activeDaysArray,
      kenderDateCountMap,
      zilaList: res.locals.zilaList,
      ksheterList: res.locals.ksheterList,
      kenderList: res.locals.kenderList,
      selectedPrant,
      selectedZila,
      selectedKsheter,
      selectedKender,
      viewMode,
      groupedByKsheter,
      ksheterDayTotals,
    });
  } catch (err) {
    console.error("Error loading Kender attendance:", err);
    res.status(500).send("Server Error");
  }
};

exports.viewTop10Attendance = async (req, res) => {
  try {
    const user = req.session.user;

    const prantId = user.prant;
    const zilaId = user.prant;

    const includeRoles = [
      ...zilaRoles,
      ...ksheterRoles,
      ...kenderRoles,
      ...kenderTeamRoles,
      ...saadhakRoles,
    ];

    const today = new Date();
    const selectedMonth = parseInt(req.query.month) || today.getMonth() + 1;
    const selectedYear = parseInt(req.query.year) || today.getFullYear();
    const selectedScope = req.query.scope || "prant";

    const start = new Date(selectedYear, selectedMonth - 1, 1);
    const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    let prantName = "";
    try {
      const prant = await Prant.findById(prantId).lean();
      if (prant) prantName = prant.name;
    } catch (err) {
      console.error("Error fetching Prant:", err.message);
    }

    let zilaName = "";
    try {
      const zila = await Zila.findById(zilaId).lean();
      if (zila) prantName = zila.name; // (kept AS-IS)
    } catch (err) {
      console.error("Error fetching Zila:", err.message);
    }

    let attendanceData = [];
    let noData = true;

    const prantQuery = Array.isArray(req.query.prant)
      ? req.query.prant[0]
      : req.query.prant;
    const zilaQuery = Array.isArray(req.query.zila)
      ? req.query.zila[0]
      : req.query.zila;
    const ksheterQuery = Array.isArray(req.query.ksheter)
      ? req.query.ksheter[0]
      : req.query.ksheter;
    const kenderQuery = Array.isArray(req.query.kender)
      ? req.query.kender[0]
      : req.query.kender;

    const scopeSelected =
      (prantQuery && prantQuery.trim() !== "") ||
      (zilaQuery && zilaQuery.trim() !== "") ||
      (ksheterQuery && ksheterQuery.trim() !== "") ||
      (kenderQuery && kenderQuery.trim() !== "");

    const isAdhikari = (saadhak) =>
      saadhak.role?.some(
        (r) => zilaRoles.includes(r) || ksheterRoles.includes(r)
      );

    if (scopeSelected) {
      let filter = { role: { $in: includeRoles } };

      if (prantQuery && prantQuery.trim() !== "") filter.prant = prantQuery;
      if (zilaQuery && zilaQuery.trim() !== "") filter.zila = zilaQuery;
      if (ksheterQuery && ksheterQuery.trim() !== "")
        filter.ksheter = ksheterQuery;
      if (kenderQuery && kenderQuery.trim() !== "") filter.kender = kenderQuery;

      const saadhaks = await Saadhak.find(filter)
        .populate("zila", "name")
        .populate("ksheter", "name")
        .populate("kender", "name")
        .lean();

      const saadhakIds = saadhaks.map((s) => s._id);

      const attendanceRecords = await Attendance.find({
        saadhak: { $in: saadhakIds },
        date: { $gte: start, $lte: end },
      })
        .select("saadhak kender date status")
        .lean();

      const attendanceMap = {};
      const kenderOperationalDaysMap = {};

      for (const rec of attendanceRecords) {
        const saadhakId = rec.saadhak.toString();
        const kenderId = rec.kender?.toString();
        const dateStr = rec.date.toISOString().split("T")[0];

        if (rec.status === "Present") {
          if (!attendanceMap[saadhakId]) attendanceMap[saadhakId] = new Set();
          attendanceMap[saadhakId].add(dateStr);
        }

        if (kenderId) {
          if (!kenderOperationalDaysMap[kenderId])
            kenderOperationalDaysMap[kenderId] = new Set();
          kenderOperationalDaysMap[kenderId].add(dateStr);
        }
      }

      const daysInMonth =
        selectedYear === today.getFullYear() &&
        selectedMonth === today.getMonth() + 1
          ? today.getDate()
          : end.getDate();

      const threshold = Math.ceil(daysInMonth * 0.65);

      const kenderEligible = {};
      Object.entries(kenderOperationalDaysMap).forEach(
        ([kenderId, datesSet]) => {
          kenderEligible[kenderId] = datesSet.size >= threshold;
        }
      );

      // ----------------------------
      // 1) Build sortedData for NON-Adhikari
      // ----------------------------
      const sortedNonAdhikari = saadhaks
        .map((s) => {
          if (isAdhikari(s)) return null;

          const saadhakId = s._id.toString();
          const kenderId = s.kender?._id?.toString();
          if (!kenderId || !kenderEligible[kenderId]) return null;

          const presentDatesSet = attendanceMap[saadhakId] || new Set();
          const presentCount = presentDatesSet.size;

          const operationalDatesSet =
            kenderOperationalDaysMap[kenderId] || new Set();
          const totalOperationalDays = operationalDatesSet.size;

          if (presentCount === 0 || totalOperationalDays === 0) return null;

          const attendancePercentage = Number(
            ((presentCount / totalOperationalDays) * 100).toFixed(2)
          );

          const missedDays = totalOperationalDays - presentCount;

          return {
            _id: s._id,
            name: s.name,
            photoURL: s.photoUrl || "",
            kender: s.kender?.name || "N/A",
            ksheter: s.ksheter?.name || "N/A",
            attendance: [...presentDatesSet],
            presentCount,
            totalOperationalDays,
            missedDays,
            attendancePercentage,
          };
        })
        .filter((s) => s && s.attendancePercentage >= 65) // ✅ ONLY CHANGE
        .sort((a, b) => {
          if (b.presentCount !== a.presentCount)
            return b.presentCount - a.presentCount;
          if (a.missedDays !== b.missedDays) return a.missedDays - b.missedDays;
          if (a.ksheter !== b.ksheter)
            return a.ksheter.localeCompare(b.ksheter);
          if (a.kender !== b.kender) return a.kender.localeCompare(b.kender);
          return a.name.localeCompare(b.name);
        });

      let selectedSaadhaks = sortedNonAdhikari;

      // ----------------------------
      // Adhikari logic (UNCHANGED)
      // ----------------------------
      let minSaadhakPercentage = selectedSaadhaks.length
        ? Math.min(...selectedSaadhaks.map((s) => s.attendancePercentage))
        : 0;

      let maxOperationalDays = Math.max(
        ...Object.values(kenderOperationalDaysMap).map((s) => s.size || 0),
        daysInMonth
      );

      const adhikariList = saadhaks
        .map((s) => {
          if (!isAdhikari(s)) return null;

          const saadhakId = s._id.toString();
          const presentDatesSet = attendanceMap[saadhakId] || new Set();
          const presentCount = presentDatesSet.size;
          if (presentCount === 0) return null;

          const attendancePercentage =
            (presentCount / maxOperationalDays) * 100;

          if (attendancePercentage < minSaadhakPercentage) return null;

          return {
            _id: s._id,
            name: s.name,
            photoURL: s.photoUrl || "",
            ksheter: s.ksheter?.name || "Adhikari",
            kender: s.role?.[0] || "Adhikari",
            attendance: [...presentDatesSet],
            presentCount,
            totalOperationalDays: maxOperationalDays,
            missedDays: maxOperationalDays - presentCount,
            attendancePercentage: Number(attendancePercentage.toFixed(2)),
          };
        })
        .filter(Boolean);

      const combinedMap = new Map();
      selectedSaadhaks.forEach((s) => combinedMap.set(s._id.toString(), s));
      adhikariList.forEach((a) => combinedMap.set(a._id.toString(), a));

      attendanceData = Array.from(combinedMap.values());

      noData = attendanceData.length === 0;
    }

    
    // 🔥 FINAL SORT — applies to BOTH Saadhak + Adhikari
    attendanceData.sort((a, b) => {
      if (b.presentCount !== a.presentCount)
        return b.presentCount - a.presentCount;

      if (a.missedDays !== b.missedDays) return a.missedDays - b.missedDays;

      if ((a.ksheter || "") !== (b.ksheter || ""))
        return (a.ksheter || "").localeCompare(b.ksheter || "");

      if ((a.kender || "") !== (b.kender || ""))
        return (a.kender || "").localeCompare(b.kender || "");

      return (a.name || "").localeCompare(b.name || "");
    });

    // ---------------------------------------------
    // SUMMARY BLOCK (RESTORED - UNCHANGED)
    // ---------------------------------------------
    const ksheterSummaryMap = {};
    const kenderSummaryMap = {};

    for (const saadhak of attendanceData) {
      let ksheter = saadhak.ksheter || "Unknown Ksheter";
      let kender = saadhak.kender || "Unknown Kender";

      if (saadhak.role?.some((r) => zilaRoles.includes(r))) {
        ksheter = "Adhikari";
        kender = "Adhikari";
      }

      if (saadhak.role?.some((r) => ksheterRoles.includes(r))) {
        ksheter = "Adhikari";
        kender = "Adhikari";
      }

      if (!ksheterSummaryMap[ksheter]) {
        ksheterSummaryMap[ksheter] = { total: 0, kendras: {} };
      }

      ksheterSummaryMap[ksheter].total += 1;

      if (!ksheterSummaryMap[ksheter].kendras[kender]) {
        ksheterSummaryMap[ksheter].kendras[kender] = 0;
      }

      ksheterSummaryMap[ksheter].kendras[kender] += 1;

      if (!kenderSummaryMap[kender]) {
        kenderSummaryMap[kender] = 0;
      }
      kenderSummaryMap[kender] += 1;
    }

    return res.render("attendance/top10", {
      attendanceData,
      selectedMonth,
      selectedYear,
      selectedScope,
      topN: parseInt(req.query.top) || 10,
      prantName,
      zilaName,
      noData,
      reportGenerated: scopeSelected,
      prantList: res.locals.prantList,
      zilaList: res.locals.zilaList,
      ksheterList: res.locals.ksheterList,
      kenderList: res.locals.kenderList,
      selectedZila: res.locals.selectedZila,
      selectedKsheter: res.locals.selectedKsheter,
      selectedKender: res.locals.selectedKender,
      ksheterSummaryMap,
      kenderSummaryMap,
    });
  } catch (err) {
    console.error("Error loading top 10 saadhaks:", err);
    res.status(500).send("Server Error");
  }
};

exports.getMissingForm = async (req, res) => {
  const kendras = await Kender.find().sort({ name: 1 });

  // Compute default dates
  const toDate = new Date();
  const fromDate = new Date();
  fromDate.setDate(toDate.getDate() - 4); // 5 days total (inclusive)

  // Format to YYYY-MM-DD
  const format = (d) => d.toISOString().slice(0, 10);

  res.render("attendance/missingForm", {
    kendras,
    defaultFrom: format(fromDate),
    defaultTo: format(toDate),
  });
};

const normalizeScopeValue = (value) => {
  if (!value) return "";
  if (Array.isArray(value)) return value[0] || "";
  return String(value);
};

exports.generateMissingReport = async (req, res) => {
  const { from, to } = req.body;
  const user = req.session.user;
  const prantValue = normalizeScopeValue(req.body.zila);
  const zilaValue = normalizeScopeValue(req.body.zila);
  const ksheterValue = normalizeScopeValue(req.body.ksheter);
  const kender = normalizeScopeValue(req.body.kender);

  let query = {};

  if (prantValue.trim() !== "") query.prant = prantValue;
  if (zilaValue.trim() !== "") query.zila = zilaValue;
  if (ksheterValue.trim() !== "") query.ksheter = ksheterValue;
  if (kender.trim() !== "") query.kender = kender;

  if (user.kender) query.kender = user.kender;
  if (user.ksheter) query.ksheter = user.ksheter;
  if (user.zila) query.zila = user.zila;
  if (user.prant) query.prant = user.prant;

  const saadhaks = await Saadhak.find(query).sort({ name: 1 });
  const saadhakIds = saadhaks.map((s) => s._id);

  const fromDate = new Date(from);
  fromDate.setUTCHours(0, 0, 0, 0);

  const toDate = new Date(to);
  toDate.setUTCHours(23, 59, 59, 999);

  const attendance = await Attendance.find({
    saadhak: { $in: saadhakIds },
    date: { $gte: fromDate, $lte: toDate },
  });

  const attendanceMap = new Map();
  attendance.forEach((a) => {
    const sid = a.saadhak.toString();
    const localDate = new Date(a.date);
    localDate.setMinutes(localDate.getMinutes() + 330);
    const dateStr = localDate.toISOString().split("T")[0];

    if (!attendanceMap.has(sid)) attendanceMap.set(sid, new Set());
    attendanceMap.get(sid).add(dateStr);
  });

  const dateList = [];
  let current = new Date(fromDate);
  while (current <= toDate) {
    const temp = new Date(current);
    temp.setMinutes(temp.getMinutes() + 330);
    dateList.push(temp.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  const missing = saadhaks.filter((s) => {
    const sid = s._id.toString();
    const attendedDates = attendanceMap.get(sid) || new Set();
    const attendedAny = dateList.some((d) => attendedDates.has(d));
    return !attendedAny;
  });

  const lastAttendanceMap = {};
  const lastAttendance = await Attendance.aggregate([
    { $match: { saadhak: { $in: saadhakIds } } },
    { $sort: { date: -1 } },
    { $group: { _id: "$saadhak", lastDate: { $first: "$date" } } },
  ]);
  lastAttendance.forEach((entry) => {
    lastAttendanceMap[entry._id.toString()] = entry.lastDate;
  });

  // ✅ Efficiently map kenderName for each Saadhak
  const kenderIds = [...new Set(missing.map((s) => s.kender).filter(Boolean))];
  const kenders = await Kender.find({ _id: { $in: kenderIds } }).select("name");
  const kenderMap = {};
  kenders.forEach((k) => {
    kenderMap[k._id.toString()] = k.name;
  });

  const result = missing.map((s) => ({
    _id: s._id,
    name: s.name,
    mobile: s.mobile,
    lastAttended: lastAttendanceMap[s._id.toString()] || null,
    kenderName: s.kender ? kenderMap[s.kender.toString()] || "—" : "—",
  }));

  // Fetch readable names:
  const zilaName = zilaValue
    ? (await Zila.findById(zilaValue).select("name"))?.name || "—"
    : "—";
  const ksheterName = ksheterValue
    ? (await Ksheter.findById(ksheterValue).select("name"))?.name || "—"
    : "—";
  const kenderName = kender
    ? (await Kender.findById(kender).select("name"))?.name || "—"
    : "—";

  res.render("attendance/missingReport", {
    missing: result,
    from,
    to,
    total: result.length,
    zila: zilaValue,
    ksheter: ksheterValue,
    kender,
    zilaName,
    ksheterName,
    kenderName,
  });
};

exports.exportMissingPDF = async (req, res) => {
  const { from, to } = req.query;
  const sortBy = req.query.sortBy;
  const sortDir = req.query.sortDir;
  const user = req.session.user;

  const zilaValue = normalizeScopeValue(req.query.zila);
  const ksheterValue = normalizeScopeValue(req.query.ksheter);
  const kender = normalizeScopeValue(req.query.kender);
  const filter = req.query.filter || "all";

  if (!from || !to) {
    return res.status(400).send("Missing required parameters");
  }

  let query = {};

  if (zilaValue.trim() !== "") query.zila = zilaValue;
  if (ksheterValue.trim() !== "") query.ksheter = ksheterValue;
  if (kender.trim() !== "") query.kender = kender;

  // 🛑 Fetch Names for Display (New Code)
  let zilaName = "All";
  let ksheterName = "All";
  let kenderName = "All";

  if (zilaValue.trim() !== "") {
    const zilaDoc = await Zila.findById(zilaValue).lean();
    if (zilaDoc) zilaName = zilaDoc.name;
  }

  if (ksheterValue.trim() !== "") {
    const ksheterDoc = await Ksheter.findById(ksheterValue).lean();
    if (ksheterDoc) ksheterName = ksheterDoc.name;
  }

  if (kender.trim() !== "") {
    const kenderDoc = await Kender.findById(kender).lean();
    if (kenderDoc) kenderName = kenderDoc.name;
  }

  const saadhaks = await Saadhak.find(query).sort({ name: 1 });
  const saadhakIds = saadhaks.map((s) => s._id);

  const fromDate = new Date(from);
  fromDate.setUTCHours(0, 0, 0, 0);

  const toDate = new Date(to);
  toDate.setUTCHours(23, 59, 59, 999);

  const attendance = await Attendance.find({
    saadhak: { $in: saadhakIds },
    date: { $gte: fromDate, $lte: toDate },
  });

  const attendanceMap = new Map();
  attendance.forEach((a) => {
    const sid = a.saadhak.toString();
    const localDate = new Date(a.date);
    localDate.setMinutes(localDate.getMinutes() + 330);
    const dateStr = localDate.toISOString().split("T")[0];
    if (!attendanceMap.has(sid)) attendanceMap.set(sid, new Set());
    attendanceMap.get(sid).add(dateStr);
  });

  const dateList = [];
  let current = new Date(fromDate);
  while (current <= toDate) {
    const temp = new Date(current);
    temp.setMinutes(temp.getMinutes() + 330);
    dateList.push(temp.toISOString().split("T")[0]);
    current.setDate(current.getDate() + 1);
  }

  const missing = saadhaks.filter((s) => {
    const sid = s._id.toString();
    const attendedDates = attendanceMap.get(sid) || new Set();
    const attendedAny = dateList.some((d) => attendedDates.has(d));
    return !attendedAny;
  });

  const lastAttendanceMap = {};
  const lastAttendance = await Attendance.aggregate([
    { $match: { saadhak: { $in: saadhakIds } } },
    { $sort: { date: -1 } },
    { $group: { _id: "$saadhak", lastDate: { $first: "$date" } } },
  ]);
  lastAttendance.forEach((entry) => {
    lastAttendanceMap[entry._id.toString()] = entry.lastDate;
  });

  // ✅ Efficiently map kenderName for each Saadhak
  const kenderIds = [...new Set(missing.map((s) => s.kender).filter(Boolean))];
  const kenders = await Kender.find({ _id: { $in: kenderIds } }).select("name");
  const kenderMap = {};
  kenders.forEach((k) => {
    kenderMap[k._id.toString()] = k.name;
  });

  const result = missing.map((s) => {
    const last = lastAttendanceMap[s._id.toString()] || null;
    const daysSince = last
      ? Math.floor(
          (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)
        )
      : -1;

    return {
      name: s.name,
      mobile: s.mobile,
      lastAttended: last,
      kenderName: s.kender ? kenderMap[s.kender.toString()] || "—" : "—",
      daysSince, // ✅ added field
    };
  });

  let filteredResult = result;

  if (filter === "never") {
    filteredResult = result.filter((s) => !s.lastAttended);
  } else if (filter === "attended") {
    filteredResult = result.filter((s) => !!s.lastAttended);
  }

  if (sortBy === "name") {
    filteredResult.sort((a, b) =>
      sortDir === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
  } else if (sortBy === "days") {
    const getDays = (d) =>
      d
        ? Math.floor(
            (Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24)
          )
        : -1;

    filteredResult.sort((a, b) =>
      sortDir === "asc" ? a.daysSince - b.daysSince : b.daysSince - a.daysSince
    );
  }

  const baseUrl = "https://www.joinyog.in";
  const fs = require("fs");
  const path = require("path");

  const logoPath = path.join(__dirname, "../public/images/logo.jpg");
  const logoData = fs.readFileSync(logoPath).toString("base64");
  const logoBase64 = `data:image/jpeg;base64,${logoData}`;

  pdfExport.renderPDF(
    res,
    "attendance/pdfMissing",
    {
      missing: filteredResult,
      roles,
      user,
      from,
      to,
      total: filteredResult.length,
      logoBase64,
      baseUrl,
      zilaName,
      ksheterName,
      kenderName, // 🛑 Pass Names to EJS
    },
    `Missing_Attendance_${from}_to_${to}.pdf`
  );
};

exports.kenderTeamRankReport = async (req, res) => {
  try {
    const kenderId = req.session.user.kender;
    const ksheterId = req.session.user.ksheter;
    const zilaId = req.session.user.zila;

    const today = new Date();
    const selectedMonth = parseInt(req.query.month) || today.getMonth() + 1;
    const selectedYear = parseInt(req.query.year) || today.getFullYear();

    const startDate = new Date(
      `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`
    );
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    const saadhaks = await Saadhak.find({ kender: kenderId }).lean();

    async function buildRankMap(scopeField, scopeValue) {
      const scopeSaadhaks = await Saadhak.find({
        [scopeField]: scopeValue,
      }).select("_id");

      const attendanceRecords = await Attendance.aggregate([
        {
          $match: {
            saadhak: { $in: scopeSaadhaks.map((s) => s._id) },
            date: { $gte: startDate, $lte: endDate },
            status: "Present",
          },
        },
        {
          $group: {
            _id: "$saadhak",
            presentCount: { $sum: 1 },
          },
        },
        { $sort: { presentCount: -1 } },
      ]);

      const rankMap = {};
      let currentRank = 1;
      let previousCount = null;

      attendanceRecords.forEach((record) => {
        const presentCount = record.presentCount;

        if (presentCount !== previousCount) {
          previousCount = presentCount;
          rankMap[record._id.toString()] = {
            rank: currentRank,
            presentCount: presentCount,
          };
          currentRank++; // Move to next rank group
        } else {
          rankMap[record._id.toString()] = {
            rank: currentRank - 1, // Same rank as previous
            presentCount: presentCount,
          };
        }
      });

      return rankMap;
    }

    const zilaRankMap = await buildRankMap("zila", zilaId);
    const ksheterRankMap = await buildRankMap("ksheter", ksheterId);
    const kenderRankMap = await buildRankMap("kender", kenderId);

    let reportData = saadhaks
      .map((s) => {
        const idStr = s._id.toString();

        const zilaRankData = zilaRankMap[idStr] || {
          rank: "No Rank",
          presentCount: 0,
        };
        const ksheterRankData = ksheterRankMap[idStr] || {
          rank: "No Rank",
          presentCount: 0,
        };
        const kenderRankData = kenderRankMap[idStr] || {
          rank: "No Rank",
          presentCount: 0,
        };

        return {
          name: s.name,
          mobile: s.mobile,
          zilaRank: zilaRankData.rank,
          ksheterRank: ksheterRankData.rank,
          kenderRank: kenderRankData.rank,
          attendanceDays: kenderRankData.presentCount,
        };
      })
      .filter((s) => s.attendanceDays > 0);

    reportData.sort((a, b) => {
      if (b.attendanceDays !== a.attendanceDays) {
        return b.attendanceDays - a.attendanceDays;
      }
      return a.name.localeCompare(b.name);
    });

    res.render("attendance/kender-team-rank", {
      reportData,
      selectedMonth,
      selectedYear,
    });
  } catch (err) {
    console.error("Error generating Kender Team Rank Report:", err);
    res.status(500).send("Server Error");
  }
};

exports.exportKenderTeamRankPDF = async (req, res) => {
  try {
    const kenderId = req.session.user.kender;
    const ksheterId = req.session.user.ksheter;
    const zilaId = req.session.user.zila;

    const { month, year } = req.query;

    const selectedMonth = parseInt(month) || new Date().getMonth() + 1;
    const selectedYear = parseInt(year) || new Date().getFullYear();

    const startDate = new Date(
      `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`
    );
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

    const saadhaks = await Saadhak.find({ kender: kenderId }).lean();

    async function buildRankMap(scopeField, scopeValue) {
      const scopeSaadhaks = await Saadhak.find({
        [scopeField]: scopeValue,
      }).select("_id");

      const attendanceRecords = await Attendance.aggregate([
        {
          $match: {
            saadhak: { $in: scopeSaadhaks.map((s) => s._id) },
            date: { $gte: startDate, $lte: endDate },
            status: "Present",
          },
        },
        {
          $group: {
            _id: "$saadhak",
            presentCount: { $sum: 1 },
          },
        },
        { $sort: { presentCount: -1 } },
      ]);

      const rankMap = {};
      let currentRank = 1;
      let previousCount = null;

      attendanceRecords.forEach((record) => {
        const presentCount = record.presentCount;

        if (presentCount !== previousCount) {
          previousCount = presentCount;
          rankMap[record._id.toString()] = { rank: currentRank, presentCount };
          currentRank++;
        } else {
          rankMap[record._id.toString()] = {
            rank: currentRank - 1,
            presentCount,
          };
        }
      });

      return rankMap;
    }

    const zilaRankMap = await buildRankMap("zila", zilaId);
    const ksheterRankMap = await buildRankMap("ksheter", ksheterId);
    const kenderRankMap = await buildRankMap("kender", kenderId);

    let reportData = saadhaks
      .map((s) => {
        const idStr = s._id.toString();

        const zilaRankData = zilaRankMap[idStr] || {
          rank: "No Rank",
          presentCount: 0,
        };
        const ksheterRankData = ksheterRankMap[idStr] || {
          rank: "No Rank",
          presentCount: 0,
        };
        const kenderRankData = kenderRankMap[idStr] || {
          rank: "No Rank",
          presentCount: 0,
        };

        return {
          name: s.name,
          mobile: s.mobile,
          zilaRank: zilaRankData.rank,
          ksheterRank: ksheterRankData.rank,
          kenderRank: kenderRankData.rank,
          attendanceDays: kenderRankData.presentCount,
        };
      })
      .filter((s) => s.attendanceDays > 0);

    reportData.sort((a, b) => {
      if (b.attendanceDays !== a.attendanceDays) {
        return b.attendanceDays - a.attendanceDays;
      }
      return a.name.localeCompare(b.name);
    });

    const kenderDoc = await Kender.findById(kenderId).lean();
    const kenderName = kenderDoc ? kenderDoc.name : "Kender";

    const fs = require("fs");
    const path = require("path");

    const logoPath = path.join(__dirname, "../public/images/logo.jpg");
    const logoData = fs.readFileSync(logoPath).toString("base64");
    const logoBase64 = `data:image/jpeg;base64,${logoData}`;

    const baseUrl = "https://www.joinyog.in";

    const filename = `${kenderName.replace(/\s+/g, "_")}_Rank_Report_${selectedMonth}_${selectedYear}.pdf`;

    pdfExport.renderPDF(
      res,
      "attendance/pdfRankReport", // Ensure this EJS exists and uses kenderName, etc.
      {
        reportData,
        selectedMonth,
        selectedYear,
        logoBase64,
        baseUrl,
        kenderName,
      },
      filename
    );
  } catch (error) {
    console.error("Error exporting Kender Team Rank PDF:", error);
    res.status(500).send("PDF Export Failed");
  }
};

exports.viewIndividualAttendance = async (req, res) => {
  const { saadhakId } = req.params;
  const { month, year } = req.query;

  try {
    const saadhak = await Saadhak.findById(saadhakId).populate("kender");
    if (!saadhak) return res.status(404).send("Saadhak not found");

    const selectedMonth = parseInt(month);
    const selectedYear = parseInt(year);

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // getMonth is 0-based
    const currentYear = now.getFullYear();

    // If current month/year, set endDate to today. Else end of selected month.
    const endDate =
      selectedMonth === currentMonth && selectedYear === currentYear
        ? new Date(
            selectedYear,
            selectedMonth - 1,
            now.getDate(),
            23,
            59,
            59,
            999
          )
        : new Date(selectedYear, selectedMonth, 0); // end of selected month

    const startDate = new Date(
      `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`
    );

    const attendanceRecords = await Attendance.find({
      saadhak: saadhakId,
      date: { $gte: startDate, $lte: endDate },
    }).populate("kender");

    // Map day => Kender name
    const dailyVisits = {};
    attendanceRecords.forEach((rec) => {
      const day = rec.date.getDate();
      dailyVisits[day] = rec.kender?.name || "Unknown";
    });

    // Determine how many days to show (up to today if current month/year)
    const lastDayToShow =
      selectedMonth === currentMonth && selectedYear === currentYear
        ? now.getDate()
        : new Date(selectedYear, selectedMonth, 0).getDate(); // last day of selected month

    res.render("attendance/individual-details", {
      saadhak,
      month: selectedMonth,
      year: selectedYear,
      dailyVisits,
      lastDayToShow,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

exports.viewKsheterWiseAttendance = async (req, res) => {
  try {
    const user = req.session.user;
    const today = new Date();

    const selectedMonth = parseInt(req.query.month) || today.getMonth() + 1;
    const selectedYear = parseInt(req.query.year) || today.getFullYear();
    const sortBy = req.query.sortBy || "name";

    // Normalize scope values (prant, zila)
    const normalizeScopeValue = (value) => {
      if (!value) return "";
      if (Array.isArray(value)) return value[0] || "";
      return String(value).trim();
    };

    const prantQuery =
      normalizeScopeValue(req.query.prant) || user.prant?.toString() || "";
    const zilaQuery =
      normalizeScopeValue(req.query.zila) || user.zila?.toString() || "";
    const ksheterQuery =
      normalizeScopeValue(req.query.ksheter) || user.ksheter?.toString() || "";

    // Early return if scope missing
    if (!req.query.month || !req.query.year || !zilaQuery) {
      return res.render("attendance/ksheter-wise", {
        attendanceData: [],
        activeDays: [],
        selectedMonth,
        selectedYear,
        selectedZila: zilaQuery,
        selectedPrant: prantQuery,
        selectedKsheter: ksheterQuery,
        sortBy,
        ksheterList: [],
        zilaDailyTotals: {},
      });
    }

    const startDate = new Date(selectedYear, selectedMonth - 1, 1);
    const endDate = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);
    const totalDays = endDate.getDate();

    let rawDays = [];
    const isCurrentMonth =
      selectedMonth === today.getMonth() + 1 &&
      selectedYear === today.getFullYear();

    rawDays = Array.from(
      { length: isCurrentMonth ? today.getDate() : totalDays },
      (_, i) => i + 1
    );

    let ksheterList = [];

    if (user.ksheter) {
      // 🔐 Restrict to this Ksheter only if logged in user is from Ksheter level
      ksheterList = await Ksheter.find({ _id: user.ksheter });
    } else {
      // 🟢 Otherwise show all Ksheters under the selected Zila
      ksheterList = await Ksheter.find({ zila: zilaQuery });
    }

    const attendanceData = [];
    const dateTotalsMap = {};

    // Initialize all dates
    for (let day of rawDays) {
      const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      dateTotalsMap[dateKey] = 0;
    }

    for (let ksheter of ksheterList) {
      const kenders = await Kender.find({ ksheter: ksheter._id });
      const kenderIds = kenders.map((k) => k._id);
      const records = await Attendance.find({
        kender: { $in: kenderIds },
        date: { $gte: startDate, $lte: endDate },
      });

      const dailyCountMap = {};
      rawDays.forEach((day) => {
        const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        dailyCountMap[dateKey] = 0;
      });

      for (let record of records) {
        const dateKey = record.date.toISOString().slice(0, 10);
        if (dailyCountMap[dateKey] !== undefined) {
          dailyCountMap[dateKey]++;
          dateTotalsMap[dateKey]++;
        }
      }

      const totalPresent = Object.values(dailyCountMap).reduce(
        (a, b) => a + b,
        0
      );
      if (totalPresent > 0) {
        attendanceData.push({
          ksheterName: ksheter.name,
          dailyCounts: dailyCountMap,
          totalPresent,
        });
      }
    }

    // Only keep dates with actual attendance
    const activeDays = rawDays.filter((day) => {
      const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return dateTotalsMap[dateKey] > 0;
    });

    // Trim attendanceData to activeDays only
    attendanceData.forEach((row) => {
      const filteredCounts = {};
      activeDays.forEach((day) => {
        const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        filteredCounts[dateKey] = row.dailyCounts[dateKey] || 0;
      });
      row.dailyCounts = filteredCounts;
    });

    // Sort
    if (sortBy === "count") {
      attendanceData.sort((a, b) => b.totalPresent - a.totalPresent);
    } else {
      attendanceData.sort((a, b) => a.ksheterName.localeCompare(b.ksheterName));
    }

    // Final Zila Daily Totals
    const zilaDailyTotals = {};
    activeDays.forEach((day) => {
      const dateKey = `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      zilaDailyTotals[dateKey] = dateTotalsMap[dateKey];
    });

    return res.render("attendance/ksheter-wise", {
      attendanceData,
      activeDays,
      selectedMonth,
      selectedYear,
      selectedZila: zilaQuery,
      selectedPrant: prantQuery,
      sortBy,
      ksheterList,
      zilaDailyTotals,
    });
  } catch (err) {
    console.error("❌ Ksheter-wise attendance error:", err);
    res.status(500).send("Internal server error");
  }
};

exports.exportMissingExcel = async (req, res) => {
  try {
    const { from, to } = req.query;
    const sortBy = req.query.sortBy;
    const sortDir = req.query.sortDir;
    const filter = req.query.filter || "all";

    const zilaValue = normalizeScopeValue(req.query.zila);
    const ksheterValue = normalizeScopeValue(req.query.ksheter);
    const kenderValue = normalizeScopeValue(req.query.kender);

    if (!from || !to) {
      return res.status(400).send("Missing required parameters");
    }

    const query = {};
    if (zilaValue.trim() !== "") query.zila = zilaValue;
    if (ksheterValue.trim() !== "") query.ksheter = ksheterValue;
    if (kenderValue.trim() !== "") query.kender = kenderValue;

    const saadhaks = await Saadhak.find(query).sort({ name: 1 });
    const saadhakIds = saadhaks.map((s) => s._id);

    const fromDate = new Date(from);
    fromDate.setUTCHours(0, 0, 0, 0);
    const toDate = new Date(to);
    toDate.setUTCHours(23, 59, 59, 999);

    const attendance = await Attendance.find({
      saadhak: { $in: saadhakIds },
      date: { $gte: fromDate, $lte: toDate },
    });

    const attendanceMap = new Map();
    attendance.forEach((a) => {
      const sid = a.saadhak.toString();
      const localDate = new Date(a.date);
      localDate.setMinutes(localDate.getMinutes() + 330);
      const dateStr = localDate.toISOString().split("T")[0];
      if (!attendanceMap.has(sid)) attendanceMap.set(sid, new Set());
      attendanceMap.get(sid).add(dateStr);
    });

    const dateList = [];
    let current = new Date(fromDate);
    while (current <= toDate) {
      const temp = new Date(current);
      temp.setMinutes(temp.getMinutes() + 330);
      dateList.push(temp.toISOString().split("T")[0]);
      current.setDate(current.getDate() + 1);
    }

    const missingSaadhaks = saadhaks.filter((s) => {
      const sid = s._id.toString();
      const attendedDates = attendanceMap.get(sid) || new Set();
      const attendedAny = dateList.some((d) => attendedDates.has(d));
      return !attendedAny;
    });

    const lastAttendanceMap = {};
    const lastAttendance = await Attendance.aggregate([
      { $match: { saadhak: { $in: saadhakIds } } },
      { $sort: { date: -1 } },
      { $group: { _id: "$saadhak", lastDate: { $first: "$date" } } },
    ]);
    lastAttendance.forEach((entry) => {
      lastAttendanceMap[entry._id.toString()] = entry.lastDate;
    });

    const kenderIds = [
      ...new Set(missingSaadhaks.map((s) => s.kender).filter(Boolean)),
    ];
    const kenders = await Kender.find({ _id: { $in: kenderIds } }).select(
      "name"
    );
    const kenderMap = {};
    kenders.forEach((k) => {
      kenderMap[k._id.toString()] = k.name;
    });

    const result = missingSaadhaks.map((s) => {
      const last = lastAttendanceMap[s._id.toString()] || null;
      const daysSince = last
        ? Math.floor(
            (Date.now() - new Date(last).getTime()) / (1000 * 60 * 60 * 24)
          )
        : -1;

      return {
        name: s.name,
        mobile: s.mobile,
        lastAttended: last,
        kenderName: s.kender ? kenderMap[s.kender.toString()] || "—" : "—",
        daysSince,
      };
    });

    let filteredResult = result;

    if (filter === "never") {
      filteredResult = result.filter((s) => !s.lastAttended);
    } else if (filter === "attended") {
      filteredResult = result.filter((s) => !!s.lastAttended);
    }

    if (sortBy === "name") {
      filteredResult.sort((a, b) =>
        sortDir === "asc"
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name)
      );
    } else if (sortBy === "days") {
      filteredResult.sort((a, b) => a.daysSince - b.daysSince);
      if (sortDir === "desc") filteredResult.reverse();
    }

    // Create Excel sheet
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Missing Attendance");

    sheet.addRow([
      "S.No",
      "Name",
      "Mobile",
      "Kender",
      "Last Attended",
      "Days Since",
    ]);

    filteredResult.forEach((s, i) => {
      const last = s.lastAttended
        ? new Date(s.lastAttended).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "Never Attended";

      const days = s.daysSince === -1 ? "—" : s.daysSince;

      sheet.addRow([i + 1, s.name, s.mobile, s.kenderName, last, days]);
    });

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Missing_Attendance_${from}_to_${to}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel Export Error:", err);
    res.status(500).send("Error generating Excel file");
  }
};

exports.monthlyAttendanceSummary = async (req, res) => {
  try {
    const { kender } = req.query;
    const today = new Date();

    // Last 12 months range
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const start = new Date(today.getFullYear(), today.getMonth() - 11, 1);

    const summary = await Attendance.aggregate([
      {
        $match: {
          kender: new mongoose.Types.ObjectId(kender),
          date: { $gte: start, $lt: end },
        },
      },

      // Extract year & month
      {
        $addFields: {
          year: { $year: "$date" },
          month: { $month: "$date" },
        },
      },

      // Group by saadhak + month
      {
        $group: {
          _id: {
            saadhak: "$saadhak",
            year: "$year",
            month: "$month",
          },
          count: { $sum: 1 },
        },
      },

      // Regroup by saadhak to pivot months
      {
        $group: {
          _id: "$_id.saadhak",
          months: {
            $push: {
              year: "$_id.year",
              month: "$_id.month",
              count: "$count",
            },
          },
        },
      },

      // Lookup Saadhak details
      {
        $lookup: {
          from: "saadhaks",
          localField: "_id",
          foreignField: "_id",
          as: "saadhak",
        },
      },
      { $unwind: "$saadhak" },
    ]);

    // -------------------------------------------------------
    // CREATE 12 MONTH KEYS FIRST (today12)
    // -------------------------------------------------------
    const today12 = [];
    for (let i = 0; i < 12; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      today12.push({
        key: `${d.getFullYear()}-${d.getMonth() + 1}`,
        date: d,
      });
    }

    // -------------------------------------------------------
    // CONSTRUCT FINAL TABLE ROWS BASED ON 12 FIXED MONTHS
    // -------------------------------------------------------
    const data = summary.map((s) => {
      const row = {
        name: s.saadhak.name,
        mobile: s.saadhak.mobile,
      };

      // Initialize all 12 months to 0
      today12.forEach((m) => {
        row[m.key] = 0;
      });

      // Fill real attendance values
      s.months.forEach((m) => {
        const key = `${m.year}-${m.month}`;
        if (row[key] !== undefined) {
          row[key] = m.count;
        }
      });

      // Calculate total attendance for this saadhak
      let total = 0;
      today12.forEach((m) => {
        total += row[m.key] || 0;
      });
      row.total = total;

      return row;
    });

    // -------------------------------------------------------
    // FIND MONTHS THAT HAVE ANY ATTENDANCE
    // -------------------------------------------------------
    const monthTotals = {};
    today12.forEach((m) => (monthTotals[m.key] = 0));

    data.forEach((row) => {
      today12.forEach((m) => {
        monthTotals[m.key] += row[m.key] || 0;
      });
    });

    // Keep only months where total attendance > 0
    const filteredMonths = today12.filter((m) => monthTotals[m.key] > 0);

    // Sort months: oldest → newest
    filteredMonths.sort((a, b) => a.date - b.date);

    // -------------------------------------------------------
    // SORT SAADHAKS ALPHABETICALLY
    // -------------------------------------------------------
    data.sort((a, b) => a.name.localeCompare(b.name));

    // -------------------------------------------------------
    // RENDER
    // -------------------------------------------------------
    res.render("attendance/monthlySummary", {
      data,
      months: filteredMonths,
      today,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error generating summary");
  }
};

// --- FIXED EXCEL EXPORT CONTROLLER ---
exports.exportAttendanceExcel = async (req, res) => {
  try {
    const user = req.session.user;
    const userRoles = user.roles;
    const monthsToShow = parseInt(req.body.months) || 12;
    const today = new Date();

    // --- 1️⃣ Build kender filter based on user role ---
    let kenderFilter = {};

    if (userRoles.some((r) => adminRoles.includes(r))) {
      // admin sees all
    } else if (userRoles.some((r) => kenderRoles.includes(r))) {
      kenderFilter.kender = new mongoose.Types.ObjectId(user.kender);
    } else if (userRoles.some((r) => ksheterRoles.includes(r))) {
      const kenders = await Kender.find({
        ksheter: new mongoose.Types.ObjectId(user.ksheter),
      }).select("_id");
      kenderFilter.kender = {
        $in: kenders.map((k) => new mongoose.Types.ObjectId(k._id)),
      };
    } else if (userRoles.some((r) => zilaRoles.includes(r))) {
      const ksheters = await Ksheter.find({
        zila: new mongoose.Types.ObjectId(user.zila),
      }).select("_id");
      const kenders = await Kender.find({
        ksheter: {
          $in: ksheters.map((k) => new mongoose.Types.ObjectId(k._id)),
        },
      }).select("_id");
      kenderFilter.kender = {
        $in: kenders.map((k) => new mongoose.Types.ObjectId(k._id)),
      };
    } else {
      kenderFilter.kender = new mongoose.Types.ObjectId(user.kender);
    }

    // --- 2️⃣ Date Range ---
    const start = new Date(today.getFullYear(), today.getMonth() - 11, 1);
    const end = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // --- 3️⃣ Aggregate Attendance ---
    const summary = await Attendance.aggregate([
      { $match: { ...kenderFilter, date: { $gte: start, $lt: end } } },
      { $addFields: { year: { $year: "$date" }, month: { $month: "$date" } } },
      {
        $group: {
          _id: { saadhak: "$saadhak", year: "$year", month: "$month" },
          count: { $sum: 1 },
        },
      },
      {
        $group: {
          _id: "$_id.saadhak",
          months: {
            $push: { year: "$_id.year", month: "$_id.month", count: "$count" },
          },
        },
      },
      {
        $lookup: {
          from: "saadhaks",
          localField: "_id",
          foreignField: "_id",
          as: "saadhak",
        },
      },
      { $unwind: "$saadhak" },
    ]);

    // --- 4️⃣ Month Keys (ascending: old → new) ---
    let monthKeys = [];
    for (let i = monthsToShow - 1; i >= 0; i--) {
      const dt = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthKeys.push(`${dt.getFullYear()}-${dt.getMonth() + 1}`);
    }

    // --- Build data rows ---
    let data = summary.map((s) => {
      const row = {
        name: s.saadhak.name,
        mobile: s.saadhak.mobile,
        total: 0,
      };

      monthKeys.forEach((key) => (row[key] = 0));

      s.months.forEach((m) => {
        const key = `${m.year}-${m.month}`;
        if (row[key] !== undefined) {
          row[key] = m.count;
          row.total += m.count;
        }
      });

      return row;
    });

    // --- 4.1️⃣ FIXED: Remove zero-total rows (correct place) ---
    data = data.filter((r) => r.total > 0);

    // --- Sorting (unchanged) ---
    data.sort((a, b) => a.name.localeCompare(b.name));

    // --- Month Labels ---
    const lastMonths = monthKeys.map((key) => {
      const [year, month] = key.split("-");
      const dt = new Date(year, month - 1, 1);
      return {
        key,
        label: `${dt.toLocaleString("default", { month: "short" })}-${year}`,
      };
    });

    // --- 6️⃣ Excel generation ---
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Attendance Summary");

    const headerRow = ["Saadhak"];
    lastMonths.forEach((m) => headerRow.push(m.label));
    headerRow.push("Total");

    const rowHeader = sheet.addRow(headerRow);
    rowHeader.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1B5E20" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });

    data.forEach((saadhak) => {
      const rowValues = [saadhak.name];

      lastMonths.forEach((m) => rowValues.push(saadhak[m.key] || 0));

      rowValues.push(saadhak.total);
      sheet.addRow(rowValues);
    });

    sheet.columns.forEach((col) => (col.width = 15));
    sheet.getColumn(1).width = 25;

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Attendance_Summary_${Date.now()}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating Excel file");
  }
};
