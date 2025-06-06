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

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = new Date();
    start.setHours(0, 0, 0, 0); // today at 00:00:00

    const end = new Date();
    end.setHours(24, 0, 0, 0); // today at 23:59:59.999

    let query = {};
    const ksheterRoles = ["Ksheter Pradhan", "Ksheter Mantri"];
    const zilaRoles = [
      "Zila Pradhan",
      "Zila Mantri",
      "Sangathan Mantri",
      "Cashier",
    ];

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
        query.$or = [
          { kender: user.kender }, // Kender team
          { zila: user.zila, role: { $in: ksheterRoles } }, // Ksheter team
          { zila: user.zila, role: { $in: zilaRoles } }, // Zila team
        ];
      }
      if (user.roles.includes("Saadhak")) {
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

    // Now render the view with the sorted list
    res.render("attendance/mark", {
      saadhaks: sortedSaadhaks,
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
    const selectedDate = req.query.date ? new Date(req.query.date) : new Date();

    const start = new Date(selectedDate);
    start.setHours(0, 0, 0, 0);

    const end = new Date(selectedDate);
    end.setHours(23, 59, 59, 999);

    let attendanceRecords = await Attendance.find({
      date: { $gte: start, $lte: end },
      status: "Present",
      kender: user.kender,
    }).populate("saadhak");

    // console.log(attendanceRecords);

    // Remove records with missing saadhak or saadhak.name
    attendanceRecords = attendanceRecords.filter((record) => {
      return record.saadhak && record.saadhak.name;
    });

    // Then safely sort
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

    // console.log(pramukhs);

    // console.log (kenderPramukh);
    // console.log(sehKenderPramukh);

    res.render("attendance/today", {
      saadhaks: attendanceRecords,
      message:
        attendanceRecords.length === 0
          ? "No attendance marked for selected date"
          : "",
      kenderName: kender.name,
      kenderPramukh: kenderPramukh || {},
      sehKenderPramukh: sehKenderPramukh || {},
      attendanceDateFormatted: selectedDate.toLocaleDateString("en-IN"),
      attendanceDate: selectedDate.toISOString().split("T")[0],
      randomMessage: messages[Math.floor(Math.random() * messages.length)],
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
    // console.log(req.session.user);
    const today = new Date();
    const selectedMonth = parseInt(req.query.month) || today.getMonth() + 1; // 1–12
    const selectedYear = parseInt(req.query.year) || today.getFullYear();

    const allKenders = await Kender.find({ zila: req.session.user.zila }).sort(
      "name"
    );

    let attendanceData = [];
    let saadhaks = [];
    let daysInMonth = 0;
    let activeDaysArray = [];

    if (kender && month && year) {
      const start = new Date(`${selectedYear}-${selectedMonth}-01`);
      const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59); // last day of month

      // Get all Saadhaks under the selected Kender
      saadhaks = await Saadhak.find({ kender });

      // Attendance records in that period
      const attendanceRecords = await Attendance.find({
        kender,
        date: { $gte: start, $lte: end },
      });

      // Map attendance by saadhakId
      const attendanceMap = {};
      attendanceRecords.forEach((record) => {
        if (!attendanceMap[record.saadhak]) {
          attendanceMap[record.saadhak] = [];
        }
        attendanceMap[record.saadhak].push(
          record.date.toISOString().split("T")[0]
        );
      });

      // Prepare final data
      // Prepare final data and filter out those with 0 days present
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

      // Sorting logic
      if (sortBy === "count") {
        attendanceData.sort((a, b) => {
          if (b.presentCount === a.presentCount) {
            return a.name.localeCompare(b.name);
          }
          return b.presentCount - a.presentCount;
        });
      } else {
        // Default sort by name
        attendanceData.sort((a, b) => a.name.localeCompare(b.name));
      }

      // Determine which days have at least one attendance
      const activeDays = new Set();
      attendanceData.forEach((s) => {
        s.attendance.forEach((dateStr) => {
          const day = parseInt(dateStr.split("-")[2]); // Extract day from YYYY-MM-DD
          activeDays.add(day);
        });
      });

      // Convert Set to sorted array
      activeDaysArray = Array.from(activeDays).sort((a, b) => a - b);

      daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    }

    const selectedKenderData = await Kender.findById(kender);
    const selectedKenderName = selectedKenderData
      ? selectedKenderData.name
      : "Kender";
    // console.log(activeDaysArray);
    // console.log(req.query);

    res.render("attendance/view", {
      allKenders,
      selectedKender: kender || "",
      selectedKenderName,
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
    const { month, year, sortBy } = req.query;
    const today = new Date();
    const selectedMonth = parseInt(month) || today.getMonth() + 1;
    const selectedYear = parseInt(year) || today.getFullYear();

    const allKenders = await Kender.find({ zila: req.session.user.zila }).sort(
      "name"
    );

    let attendanceData = [];
    let daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
    let activeDaysArray = [];
    let kenderDateCountMap = {};

    if (month && year) {
      const start = new Date(
        `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`
      );
      const end = new Date(selectedYear, selectedMonth, 0, 23, 59, 59);

      const eligibleKenders = await Kender.find({
        $or: [
          { zila: req.session.user.zila },
          { ksheter: req.session.user.ksheter },
        ],
      }).select("_id");

      const eligibleKenderIds = eligibleKenders.map((k) => k._id.toString());

      const attendanceRecords = await Attendance.find({
        kender: { $in: eligibleKenderIds },
        date: { $gte: start, $lte: end },
      }).populate("kender");

      // ✅ Map: kenderId -> { dateStr -> count }
      attendanceRecords.forEach((record) => {
        const kId = record.kender?._id?.toString();
        const dateStr = record.date.toISOString().split("T")[0];

        if (!kenderDateCountMap[kId]) kenderDateCountMap[kId] = {};
        if (!kenderDateCountMap[kId][dateStr])
          kenderDateCountMap[kId][dateStr] = 0;

        kenderDateCountMap[kId][dateStr]++;
      });

      // ✅ Prepare attendanceData per Kender (just metadata for now)
      attendanceData = allKenders
        .map((k) => {
          const attendanceObj = kenderDateCountMap[k._id.toString()] || {};
          const attendance = Object.keys(attendanceObj); // all dates present
          const presentCount = attendance.reduce(
            (sum, date) => sum + attendanceObj[date],
            0
          );
          return {
            _id: k._id,
            name: k.name,
            attendance,
            presentCount,
          };
        })
        .filter((k) => k.presentCount > 0); // ✅ Filter out Kenders with 0 total present

      // ✅ Sort
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

      // ✅ Extract active days across all Kenders
      const activeDays = new Set();
      Object.values(kenderDateCountMap).forEach((dateMap) => {
        Object.keys(dateMap).forEach((dateStr) => {
          const day = parseInt(dateStr.split("-")[2]);
          activeDays.add(day);
        });
      });

      activeDaysArray = Array.from(activeDays).sort((a, b) => a - b);
    }

    res.render("attendance/view-kender", {
      allKenders,
      selectedMonth,
      selectedYear,
      attendanceData,
      daysInMonth,
      sortBy,
      activeDays: activeDaysArray,
      kenderDateCountMap, // ✅ send this to EJS
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};
