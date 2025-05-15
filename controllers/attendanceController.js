const Saadhak = require("../models/Saadhak");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const Attendance = require("../models/Attendance");
const messages = require("../utils/motivationalMessages");

// Show attendance marking form
exports.showMarkAttendanceForm = async (req, res) => {
  try {
    const user = req.session.user;
    console.log("User Role in Session: " + user.roles);
    console.log("User ID in Session: " + user.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date();
    start.setHours(0, 0, 0, 0); // today at 00:00:00

    const end = new Date();
    end.setHours(24, 0, 0, 0); // today at 23:59:59.999

    let query = {};

    if (!user.roles.includes("Admin")) {
      if (
        user.roles.includes("Zila Pradhan") ||
        user.roles.includes("Zila Mantri") ||
        user.roles.includes("Sangathan Mantri") ||
        user.roles.includes("Cashier")
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
        user.roles.includes("Seh Kender Pramukh") ||
        user.roles.includes("Shikshak") ||
        user.roles.includes("Karyakarta")
      ) {
        query.kender = user.kender;
      }
      if (
        user.roles.includes("Saadhak")
      ) {
        query._id = user.id;
      }
    }
    
    console.log(query);

    const saadhaks = await Saadhak.find(query)
      .populate("zila")
      .populate("ksheter")
      .populate("kender")
      .sort({ name: 1 })
      .lean(); // Make sure we can attach properties

    // console.log(saadhaks.length);

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
      attendanceBySaadhak[id].push(a.date);
    }

    // Log grouped data
    // console.log("Grouped Attendance Data:", attendanceBySaadhak);

    // Step 3: Assign the grouped attendance dates to the saadhaks
    for (let saadhak of saadhaks) {
      saadhak.attendanceDates =
        attendanceBySaadhak[saadhak._id.toString()] || []; // Default to empty array if no attendance found
    }

    // Log final result
    // console.log("Updated Saadhaks with Attendance Dates:", saadhaks);

    res.render("attendance/mark", {
      saadhaks,
      zilas,
      ksheters,
      kenders,
      user,
      markedSaadhakIds,
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
    const selectedKender = req.body.kenderFilter;
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
   if (user.roles == "Saadhak"){
     await Attendance.deleteOne({
      saadhak: user.id,
      kender: selectedKender,
      date: { $gte: start, $lt: end },
    });
   } else {
    await Attendance.deleteMany({
      kender: selectedKender,
      date: { $gte: start, $lt: end },
    });
   }

    

    const records = selectedSaadhaks.map((id) => ({
      saadhak: id,
      kender: selectedKender,
      date: attendanceDate,
      status: "Present", // or whatever your schema requires
    }));

    await Attendance.insertMany(records);

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

    res.redirect("/attendance/today");
  } catch (err) {
    console.error("Error marking attendance:", err);
    res.status(500).send("Server Error");
  }
};

// Show today's attendance
exports.viewTodayAttendance = async (req, res) => {
  try {
    const user = req.session.user;

    // const today = new Date();
    // today.setHours(0, 0, 0, 0);

    const start = new Date();
    start.setHours(0, 0, 0, 0); // today at 00:00:00

    const end = new Date();
    end.setHours(23, 59, 59, 999); // today at 23:59:59.999

    const attendanceRecords = await Attendance.find({
      date: { $gte: start, $lte: end },
      status: "Present", // optional
    })
      .populate({
        path: "saadhak",
        match: { kender: user.kender },
      })
      .then((records) => records.filter((record) => record.saadhak));

    const kender = await Kender.findById(user.kender).sort({ name: 1 });

    if (attendanceRecords.length === 0) {
      return res.render("attendance/today", {
        saadhaks: [],
        message: "No attendance marked for today",
        kenderName: kender.name,
        attendanceDateFormatted: new Date().toLocaleDateString("en-IN"),
        randomMessage: messages[Math.floor(Math.random() * messages.length)],
      });
    }

    res.render("attendance/today", {
      saadhaks: attendanceRecords,
      message: "No attendance marked for today",
      kenderName: kender.name,
      attendanceDateFormatted: new Date().toLocaleDateString("en-IN"),
      randomMessage: messages[Math.floor(Math.random() * messages.length)],
    });
  } catch (err) {
    console.error("Error fetching today's attendance:", err);
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
