const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");
const archiver = require("archiver");
const ExcelJS = require('exceljs');
const Kender = require("../models/Kender");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Saadhak = require("../models/Saadhak");
const Attendance = require("../models/Attendance");
const { formatName, validateName } = require("../utils/formatters");
const drawCard = require("../helpers/drawCard");
const messages = require("../data/messages.json");
const roleConfig = require("../config/roles");

const PDFDocument = require('pdfkit');
const moment = require('moment');


const { adminRoles, prantRoles, zilaRoles, ksheterRoles, kenderRoles } =
  roleConfig;

function getRandomMessage(attendanceCount) {
  let key = "zero";
  if (attendanceCount == 0) key = "zero";
  else if (attendanceCount >= 1 && attendanceCount <= 5) key = "start";
  else if (attendanceCount <= 10) key = "build";
  else if (attendanceCount <= 20) key = "steady";
  else key = "dedicated";

  const msgList = messages[key];
  const randomIndex = Math.floor(Math.random() * msgList.length);
  return msgList[randomIndex];
}

exports.showAddForm = async (req, res) => {
  try {
    const user = req.session.user;

    let zilas = [];
    let ksheters = [];

    const zilaId = user.zila?.$oid || user.zila;
    const ksheterId = user.ksheter?.$oid || user.ksheter;

    if (user.roles.some((role) => adminRoles.includes(role))) {
      zilas = await Zila.find();
      ksheters = await Ksheter.find();
    } else if (user.roles.some((role) => prantRoles.includes(role))) {
      zilas = await Zila.find({ prant: user.prant });
      ksheters = await Ksheter.find({ prant: user.prant });
    } else if (user.roles.some((role) => zilaRoles.includes(role))) {
      zilas = await Zila.find({ _id: zilaId });
      ksheters = await Ksheter.find({ zila: zilaId });
    } else if (user.roles.some((role) => ksheterRoles.includes(role))) {
      zilas = await Zila.find({ _id: zilaId });
      ksheters = await Ksheter.find({ _id: ksheterId });
    }

    // ✅ Add these 2 lines
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentYear = new Date().getFullYear();

    res.render("kender/add", {
      zilas,
      ksheters,
      formData: {},
      error: null,
      user,
      months,
      currentYear,
    });
  } catch (err) {
    console.error("Error showing Kender Add Form:", err);
    res.status(500).send("Server Error");
  }
};

// ✅ Create New Kender
// ✅ Create New Kender
exports.createKender = async (req, res) => {
  try {
    const {
      name,
      address,
      zila,
      ksheter,
      startTime,
      creation_day,
      creation_month,
      creation_year,
    } = req.body;

    const user = req.session.user;

    const formData = {
      name,
      address,
      zila,
      ksheter,
      startTime,
      creation_day,
      creation_month,
      creation_year,
    };

    // ✅ Validate required fields
    if (!name || !address || !zila || !ksheter) {
      const zilas = await Zila.find();
      const ksheters = await Ksheter.find({ zila });
      return res.render("kender/add", {
        error: "❌ All fields are required.",
        zilas,
        ksheters,
        formData,
        user,
      });
    }

    // ✅ Validate name
    if (!validateName(name, true, "-.()")) {
      const zilas = await Zila.find();
      const ksheters = await Ksheter.find({ zila });
      return res.render("kender/add", {
        error: "❌ Kender name must contain only alphabets, numbers, -.()",
        zilas,
        ksheters,
        formData,
        user,
      });
    }

    const formattedName = formatName(name.trim());
    const formattedAddress = formatName(address.trim());

    const existing = await Kender.findOne({
      name: formattedName,
      zila,
      ksheter,
    });

    if (existing) {
      const zilas = await Zila.find();
      const ksheters = await Ksheter.find({ zila });
      return res.render("kender/add", {
        error:
          "⚠️ A Kender with this name already exists under the selected Zila and Ksheter.",
        zilas,
        ksheters,
        formData,
        user,
      });
    }

    // ✅ Build creationDate if provided
    let creationDate;
    if (creation_day && creation_month && creation_year) {
      creationDate = new Date(creation_year, creation_month - 1, creation_day);
    } else {
      creationDate = new Date(); // 👈 fallback to today
    }

    const newKender = new Kender({
      name: formattedName,
      address: formattedAddress,
      zila,
      ksheter,
      prant: user.prant,
      startTime: startTime?.trim() || undefined,
      creationDate: creationDate, // Optional
    });

    await newKender.save();
    res.redirect("/kender/manage");
  } catch (err) {
    console.error("❌ Error creating Kender:", err);
    const zilas = await Zila.find();
    const ksheters = await Ksheter.find({ zila: req.body.zila });
    res.render("kender/add", {
      error: "❌ Server Error while saving.",
      zilas,
      ksheters,
      formData: req.body,
      user: req.session.user,
    });
  }
};

// ✅ List All Kenders
exports.listKenders = async (req, res) => {
  try {
    const user = req.session.user;
    const allZilas = await Zila.find().sort({ name: 1 });
    const allKsheters = await Ksheter.find().sort({ name: 1 });

    let selectedZila = req.query.zila || "";
    let selectedKsheter = req.query.ksheter || "";

    // Adjust filters based on user role
    if (
      user.roles.includes("Zila Pradhan") ||
      user.roles.includes("Zila Mantri")
    ) {
      selectedZila = user.zila;
    }

    if (
      user.roles.includes("Ksheter Pradhan") ||
      user.roles.includes("Ksheter Mantri")
    ) {
      selectedZila = user.zila;
      selectedKsheter = user.ksheter;
    }

    // Build query
    const query = {};
    if (selectedZila) query.zila = selectedZila;
    if (selectedKsheter) query.ksheter = selectedKsheter;

    const kenders = await Kender.find(query)
      .populate("zila")
      .populate("ksheter")
      .sort({ name: 1 });

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    res.render("kender/list", {
      kenders,
      zilas: allZilas,
      ksheters: allKsheters,
      selectedZila,
      selectedKsheter,
      user,
      months, // ✅ added for creation date display
    });
  } catch (err) {
    console.error("Error fetching Kenders:", err);
    res.status(500).send("Server Error");
  }
};

exports.listByKsheter = async (req, res) => {
  try {
    const ksheterId = req.params.id;
    const ksheter = await Ksheter.findById(ksheterId).populate("zila");

    const kenders = await Kender.find({ ksheter: ksheterId })
      .populate("zila")
      .populate("ksheter")
      .sort({ name: 1 });

    res.render("kender/by-ksheter", {
      ksheter,
      kenders,
    });
  } catch (err) {
    console.error("❌ Error fetching Kenders by Ksheter:", err);
    res.status(500).send("Server Error");
  }
};

exports.showEditForm = async (req, res) => {
  try {
    const user = req.session.user;
    const kender = await Kender.findById(req.params.id)
      .populate("zila")
      .populate("ksheter");

    if (!kender) {
      return res.status(404).send("❌ Kender not found.");
    }

    let zilas = [];
    let ksheters = [];

    const zilaId = user.zila?.$oid || user.zila;
    const ksheterId = user.ksheter?.$oid || user.ksheter;

    if (user.roles.some((role) => adminRoles.includes(role))) {
      zilas = await Zila.find();
      ksheters = await Ksheter.find();
    } else if (user.roles.some((role) => prantRoles.includes(role))) {
      zilas = await Zila.find({ prant: user.prant });
      ksheters = await Ksheter.find({ prant: user.prant });
    } else if (user.roles.some((role) => zilaRoles.includes(role))) {
      zilas = await Zila.find({ _id: zilaId });
      ksheters = await Ksheter.find({ zila: zilaId });
    } else if (user.roles.some((role) => ksheterRoles.includes(role))) {
      zilas = await Zila.find({ _id: zilaId });
      ksheters = await Ksheter.find({ _id: ksheterId });
    }

    // ✅ Add months + currentYear for creation date dropdown
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const currentYear = new Date().getFullYear();

    res.render("kender/edit", {
      kender,
      zilas,
      ksheters,
      error: null,
      user,
      months,
      currentYear,
    });
  } catch (err) {
    console.error("Error showing Kender Edit Form:", err);
    res.status(500).send("Server Error");
  }
};

// ✅ Update Existing Kender
// ✅ Update Existing Kender
exports.updateKender = async (req, res) => {
  try {
    const {
      name,
      ksheter,
      zila,
      address,
      startTime,
      creation_day,
      creation_month,
      creation_year,
    } = req.body;
    const user = req.session.user;
    const kenderId = req.params.id;

    const kender = await Kender.findById(kenderId).populate("zila ksheter");

    if (!name || !ksheter || !zila || !address) {
      const zilas = await Zila.find().sort({ name: 1 });
      const ksheters = await Ksheter.find({ zila }).sort({ name: 1 });

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const currentYear = new Date().getFullYear();

      return res.render("kender/edit", {
        kender,
        zilas,
        ksheters,
        error: "❌ All fields are required.",
        user,
        months,
        currentYear,
      });
    }

    if (!validateName(name, true, "-.()")) {
      const zilas = await Zila.find().sort({ name: 1 });
      const ksheters = await Ksheter.find({ zila }).sort({ name: 1 });

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const currentYear = new Date().getFullYear();

      return res.render("kender/edit", {
        kender,
        zilas,
        ksheters,
        error: "❌ Kender name must contain only alphabets, numbers, -.()",
        user,
        months,
        currentYear,
      });
    }

    const formattedName = formatName(name.trim());
    const formattedAddress = formatName(address.trim());

    const existing = await Kender.findOne({
      _id: { $ne: kenderId },
      name: formattedName,
      zila,
      ksheter,
    });

    if (existing) {
      const zilas = await Zila.find().sort({ name: 1 });
      const ksheters = await Ksheter.find({ zila }).sort({ name: 1 });

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const currentYear = new Date().getFullYear();

      return res.render("kender/edit", {
        kender,
        zilas,
        ksheters,
        error:
          "⚠️ A Kender with this name already exists under the selected Zila and Ksheter.",
        user,
        months,
        currentYear,
      });
    }

    // ✅ Parse creationDate if provided
    let creationDate = undefined;
    if (creation_day && creation_month && creation_year) {
      creationDate = new Date(
        `${creation_year}-${creation_month}-${creation_day}`
      );
    }

    // ✅ Update Kender with optional creationDate
    await Kender.findByIdAndUpdate(kenderId, {
      name: formattedName,
      address: formattedAddress,
      ksheter,
      zila,
      startTime: startTime?.trim() || undefined,
      ...(creationDate ? { creationDate } : {}),
    });

    // ✅ Update Ksheter for all Saadhaks under this Kender
    await Saadhak.updateMany(
      { kender: kenderId },
      { $set: { ksheter: ksheter } }
    );

    res.redirect("/kender/manage");
  } catch (err) {
    console.error("❌ Error updating Kender:", err);
    res.status(500).send("Server Error while updating Kender.");
  }
};

// ✅ Delete Kender
exports.deleteKender = async (req, res) => {
  try {
    const kenderId = req.params.id;

    await Kender.findByIdAndDelete(kenderId);

    res.redirect("/kender/manage");
  } catch (err) {
    console.error("Error deleting Kender:", err);
    res.status(500).send("Server Error while deleting Kender.");
  }
};

module.exports.showPrintPage = async (req, res) => {
  const user = req.session.user;
  const kenderId = user.kender;
  if (!kenderId) {
    return res.status(400).send("Kender not associated with user.");
  }

  const saadhaks = await Saadhak.find({ kender: kenderId }).sort({ name: 1 });

  // Default to previous month
  const today = new Date();
  let targetMonth = today.getMonth(); // 0-based
  let targetYear = today.getFullYear();

  if (targetMonth === 0) {
    targetMonth = 12; // December
    targetYear -= 1;
  } else {
    targetMonth += 0; // Convert to 1-based (Jan = 1)
  }

  const firstDay = new Date(targetYear, targetMonth - 1, 1);
  const lastDay = new Date(targetYear, targetMonth, 0, 23, 59, 59);

  const saadhakIds = saadhaks.map((s) => s._id);
  const attendanceDocs = await Attendance.find({
    saadhak: { $in: saadhakIds },
    date: { $gte: firstDay, $lte: lastDay },
  });

  const attendanceCountMap = {};
  for (let s of saadhaks) {
    const count = attendanceDocs.filter((a) => a.saadhak.equals(s._id)).length;
    attendanceCountMap[s._id.toString()] = count;
  }

  res.render("kender/print-cards", {
    saadhaks,
    attendanceCountMap,
    selectedMonth: targetMonth, // ✅ already 1-based (1–12)
    selectedYear: targetYear,
    user: user,
  });
};

// controllers/kenderController.js

module.exports.generateCardsZip = async (req, res) => {
  try {
    let { selectedSaadhaks, month, year } = req.body;

    if (!selectedSaadhaks || selectedSaadhaks.length === 0) {
      return res.status(400).send("Please select at least one Saadhak.");
    }

    // 🔑 Normalize in case of single checkbox
    if (!Array.isArray(selectedSaadhaks)) {
      selectedSaadhaks = [selectedSaadhaks];
    }

    const monthName = new Date(`${year}-${month}-01`).toLocaleString("en-US", {
      month: "long",
    });
    const totalDays = new Date(year, month, 0).getDate();
    const startDate = new Date(`${year}-${month}-01`);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const user = req.session.user;
    const kenderId = user.kender;

    // Validate: all saadhaks belong to this Kender
    const saadhaks = await Saadhak.find({
      _id: { $in: selectedSaadhaks },
      kender: kenderId,
    });

    // Get Kender + Ksheter + team info
    const kender = await Kender.findById(kenderId).populate("ksheter");
    const ksheter = await Ksheter.findById(kender.ksheter);

    const kenderTeam = await Kender.findById(kenderId);

    const ksheterTeam = await Saadhak.find({
      ksheter: ksheter._id,
      roles: { $in: ["Kshetriya Pradhan", "Kshetriya Mantri"] },
    });

    const kenderStartTime = await Kender.findById(kenderId).lean();
    const startTime = kenderStartTime?.startTime || null;

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

    // ZIP creation
    const zipFilename = `Attendance_Cards_${kender.name}_${monthName}_${year}.zip`;
    res.attachment(zipFilename);
    const archive = archiver("zip");
    archive.pipe(res);

    for (const saadhak of saadhaks) {
      // Get attendance for this saadhak in the selected month
      const attendanceRecords = await Attendance.find({
        saadhak: saadhak._id,
        date: { $gte: startDate, $lte: endDate },
      });

      const attendanceDays = attendanceRecords.map((rec) =>
        new Date(rec.date).getDate()
      );
      const message = getRandomMessage(attendanceDays.length);

      const canvas = await drawCard({
        saadhak,
        kender,
        kenderTeam,
        ksheterTeam,
        monthName,
        year,
        totalDays,
        attendanceDays,
        message: message,
        startTime,
        kenderPramukh,
        sehKenderPramukh,
      });

      const buffer = canvas.toBuffer("image/png");
      const fileName = `${saadhak.name.replace(/\s+/g, "_")}_${saadhak.mobile}.png`;

      archive.append(buffer, { name: fileName });
    }

    await archive.finalize();
  } catch (err) {
    console.error("Error generating cards ZIP:", err);
    res.status(500).send("Something went wrong while generating the cards.");
  }
};

module.exports.getSaadhakCardData = async (req, res) => {
  const user = req.session.user;
  const kenderId = user.kender;

  const month = parseInt(req.query.month); // 1-based
  const year = parseInt(req.query.year);

  if (!month || !year)
    return res.status(400).json({ error: "Invalid month/year" });

  const saadhaks = await Saadhak.find({ kender: kenderId }).sort({ name: 1 });
  const saadhakIds = saadhaks.map((s) => s._id);

  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);

  const attendanceDocs = await Attendance.find({
    saadhak: { $in: saadhakIds },
    date: { $gte: startDate, $lte: endDate },
  });

  const countMap = {};
  attendanceDocs.forEach((a) => {
    const id = a.saadhak.toString();
    countMap[id] = (countMap[id] || 0) + 1;
  });

  const result = saadhaks.map((s) => ({
    _id: s._id,
    name: s.name,
    mobile: s.mobile,
    attendance: countMap[s._id.toString()] || 0,
  }));

  res.json({ saadhaks: result });
};

// Show form with pre-filled values
exports.showEditAddressTime = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.session.user;

    // Must be their own kender
    if (!user.kender || user.kender.toString() !== id) {
      return res.status(403).send("You can only edit your own Kender.");
    }

    const kender = await Kender.findById(id);
    if (!kender) return res.status(404).send("Kender not found.");

    // ✅ Pass months array to EJS
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    res.render("kender/editAddressTime", { kender, user, kenderRoles, months });
  } catch (err) {
    res.status(500).send(err.message);
  }
};

// Update address & time (with optional creation date)
exports.updateKenderAddressAndTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { address, startTime, creation_day, creation_month, creation_year } =
      req.body;
    const user = req.session.user;

    // Not their kender → unauthorized page
    if (!user.kender || user.kender.toString() !== id) {
      return res.status(403).render("error/unauthorized", {
        message: "You can only update your own Kender.",
      });
    }

    // Determine creationDate
    let creationDate;
    if (creation_day && creation_month && creation_year) {
      creationDate = new Date(creation_year, creation_month - 1, creation_day);
    } else {
      const now = new Date();
      creationDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    const updated = await Kender.findByIdAndUpdate(
      id,
      { address, startTime, creationDate },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return res.status(404).render("error/error", {
        message: "Kender not found.",
      });
    }

    res.redirect(`/dashboard?success=Kender+details+updated`);
  } catch (err) {
    res.status(500).render("error/error", {
      message: err.message,
    });
  }
};

exports.kenderYearlyReport = async (req, res) => {
  try {
    const user = req.session.user;
    const userRoles = user.roles || [];

    // ----------------------------------------
    // 1️⃣ Scope Dropdowns (dynamic based on roles)
    // ----------------------------------------
    let zilas = [];
    let ksheters = [];
    const allZilas = await Zila.find().sort({ name: 1 });
    const allKsheters = await Ksheter.find().sort({ name: 1 });
    const query = {};

    if (
      userRoles.some((r) => prantRoles.includes(r) || adminRoles.includes(r))
    ) {
      // Prant-level user or Admin can see all
      zilas = allZilas;
      ksheters = allKsheters;
      query.prant = user.prant;
    } else if (userRoles.some((r) => zilaRoles.includes(r))) {
      // Zila-level users
      zilas = await Zila.find({ _id: user.zila });
      ksheters = await Ksheter.find({ zila: user.zila });
      query.zila = user.zila;
    } else {
      return res.status(403).render("error/unauthorized", {
        message: "You do not have permission to view this report.",
      });
    }

    const recentCount = parseInt(req.query.recentYears) || 1; // last N years separate

    // Fetch kenders with creationDate
    const kenders = await Kender.find(query)
      .populate("zila", "name")
      .populate("ksheter", "name")
      .sort({ creationDate: 1 });

    // ----------------------------------------
    // 3️⃣ Prepare dynamic year ranges
    // ----------------------------------------
    const allYears = kenders
      .filter((k) => k.creationDate)
      .map((k) => k.creationDate.getFullYear());

    const yearRanges = [];
    if (allYears.length > 0) {
      const minYear = Math.min(...allYears);
      const maxYear = Math.max(...allYears);

      // last N years separate
      const lastYears = [];
      for (let y = maxYear; y > maxYear - recentCount; y--) {
        if (y >= minYear) lastYears.unshift(y); // ascending
      }

      // "Up to" column = all earlier years
      if (minYear < maxYear - recentCount + 1) {
        yearRanges.push({
          label: `Up to ${maxYear - recentCount}`,
          from: minYear,
          to: maxYear - recentCount,
        });
      }

      lastYears.forEach((y) =>
        yearRanges.push({ label: y.toString(), from: y, to: y })
      );
    }

    // ----------------------------------------
    // 4️⃣ Render Report
    // ----------------------------------------
    res.render("kender/yearlyReport", {
      user,
      zilas,
      ksheters,
      allZilas,
      allKsheters,
      kenders,
      yearRanges,
      recentCount,
    });
  } catch (err) {
    console.error("❌ Error generating Kender Yearly Report:", err);
    res.status(500).render("error/error", {
      message: "Server Error while generating report.",
    });
  }
};

exports.exportKenderYearlyPDF = async (req, res) => {
  try {
    const recentCount = parseInt(req.query.recentYears) || 1;

    const kenders = await Kender.find()
      .populate('zila', 'name')
      .populate('ksheter', 'name')
      .sort({ creationDate: 1 });

    if (!kenders.length) return res.send("No data to export");

    // Prepare year ranges
    const allYears = kenders.filter(k => k.creationDate).map(k => k.creationDate.getFullYear());
    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);

    const yearRanges = [];
    const lastYears = [];
    for (let y = maxYear; y > maxYear - recentCount; y--) {
      if (y >= minYear) lastYears.unshift(y);
    }
    if (minYear < maxYear - recentCount + 1) {
      yearRanges.push({ label: `Up to ${maxYear - recentCount}`, from: minYear, to: maxYear - recentCount });
    }
    lastYears.forEach(y => yearRanges.push({ label: y.toString(), from: y, to: y }));

    // Prepare counts
    const zilaYearCount = {};
    const columnTotals = {};
    yearRanges.forEach(r => columnTotals[r.label] = 0);

    kenders.forEach(k => {
      const zName = k.zila?.name || 'Unknown';
      if (!zilaYearCount[zName]) zilaYearCount[zName] = {};
      const year = k.creationDate?.getFullYear();
      if (!year) return;

      yearRanges.forEach(r => {
        if (year >= r.from && year <= r.to) {
          zilaYearCount[zName][r.label] = (zilaYearCount[zName][r.label] || 0) + 1;
          columnTotals[r.label] += 1;
        }
      });
    });

    const zilaNames = Object.keys(zilaYearCount).sort();

    // ---------------- CREATE PDF ----------------
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="Kender_Yearly_Report.pdf"');

    doc.pipe(res);

    // ---------------- HEADER ----------------
    doc
      .fontSize(18)
      .fillColor('#1e88e5')
      .font('Helvetica-Bold')
      .text('BHARTIYA YOG SANSTHAN (Regd.)', { align: 'center' });

    doc
      .moveDown(0.5)
      .fontSize(14)
      .fillColor('black')
      .text('Kender Yearly Creation Report', { align: 'center' });

    doc
      .fontSize(10)
      .text(`Generated on: ${moment().format('DD-MM-YYYY HH:mm')}`, { align: 'center' });

    doc.moveDown(1);

    // ---------------- TABLE ----------------
    const headers = ['Zila / Year', ...yearRanges.map(r => r.label), 'Total'];

    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const zilaColWidth = 150;
    const otherColWidth = (pageWidth - zilaColWidth) / (headers.length - 1);
    const columnWidth = [zilaColWidth, ...Array(headers.length - 2).fill(otherColWidth), otherColWidth];

    const rowHeight = 22;
    let y = doc.y;

    const tableWidth = columnWidth.reduce((a, b) => a + b, 0);
    const startX = (doc.page.width - tableWidth) / 2;

    // Table Header
    doc.fontSize(11)
      .fillColor('white')
      .rect(startX, y, tableWidth, rowHeight)
      .fill('#1e88e5');

    let x = startX;
    headers.forEach((h, i) => {
      doc.fillColor('white').text(h, x, y + 6, { width: columnWidth[i], align: 'center' });
      x += columnWidth[i];
    });

    y += rowHeight;

    // Table Rows
    zilaNames.forEach((zName, index) => {
      const row = [zName];
      let rowTotal = 0;
      yearRanges.forEach(r => {
        const count = zilaYearCount[zName][r.label] || 0;
        row.push(count === 0 ? '-' : count); // show "-" instead of 0
        rowTotal += count;
      });
      row.push(rowTotal === 0 ? '-' : rowTotal);

      const bgColor = index % 2 === 0 ? '#f9f9f9' : '#ffffff';
      doc.fillColor(bgColor).rect(startX, y, tableWidth, rowHeight).fill();

      x = startX;
      doc.fillColor('black').font('Helvetica').fontSize(10);
      row.forEach((cell, i) => {
        doc.text(cell.toString(), x, y + 6, { width: columnWidth[i], align: 'center' });
        x += columnWidth[i];
      });

      y += rowHeight;
      if (y > 740) {
        doc.addPage();
        y = 50;
      }
    });

    // Column Totals Row
    const totalRow = ['Total'];
    let grandTotal = 0;
    yearRanges.forEach(r => {
      const count = columnTotals[r.label] || 0;
      totalRow.push(count === 0 ? '-' : count);
      grandTotal += count;
    });
    totalRow.push(grandTotal === 0 ? '-' : grandTotal);

    doc.fillColor('#ffd700').rect(startX, y, tableWidth, rowHeight).fill();
    x = startX;
    doc.fillColor('black').font('Helvetica-Bold').fontSize(10);
    totalRow.forEach((cell, i) => {
      doc.text(cell.toString(), x, y + 6, { width: columnWidth[i], align: 'center' });
      x += columnWidth[i];
    });

    doc.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating PDF");
  }
};

exports.exportKenderYearlyExcel = async (req, res) => {
  try {
    const recentCount = parseInt(req.query.recentYears) || 1;

    // Fetch kenders (same as report)
    const kenders = await Kender.find()
      .populate('zila', 'name')
      .populate('ksheter', 'name')
      .sort({ creationDate: 1 });

    const allYears = kenders.filter(k => k.creationDate).map(k => k.creationDate.getFullYear());
    if (!allYears.length) return res.send("No data to export");

    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);

    const yearRanges = [];
    const lastYears = [];
    for (let y = maxYear; y > maxYear - recentCount; y--) {
      if (y >= minYear) lastYears.unshift(y);
    }
    if (minYear < maxYear - recentCount + 1) {
      yearRanges.push({ label: `Up to ${maxYear - recentCount}`, from: minYear, to: maxYear - recentCount });
    }
    lastYears.forEach(y => yearRanges.push({ label: y.toString(), from: y, to: y }));

    // Prepare counts
    const zilaYearCount = {};
    const columnTotals = {};
    yearRanges.forEach(r => columnTotals[r.label] = 0);

    kenders.forEach(k => {
      const zName = k.zila?.name || 'Unknown';
      if (!zilaYearCount[zName]) zilaYearCount[zName] = {};
      const year = k.creationDate?.getFullYear();
      if (!year) return;

      yearRanges.forEach(r => {
        if (year >= r.from && year <= r.to) {
          zilaYearCount[zName][r.label] = (zilaYearCount[zName][r.label] || 0) + 1;
          columnTotals[r.label] += 1;
        }
      });
    });

    const zilaNames = Object.keys(zilaYearCount).sort();

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Kender Yearly');

    // Header
    const headerRow = ['Zila / Year', ...yearRanges.map(r => r.label), 'Total'];
    sheet.addRow(headerRow);

    // Rows
    zilaNames.forEach(zName => {
      const row = [];
      row.push(zName);
      let rowTotal = 0;
      yearRanges.forEach(r => {
        const count = zilaYearCount[zName][r.label] || 0;
        row.push(count);
        rowTotal += count;
      });
      row.push(rowTotal);
      sheet.addRow(row);
    });

    // Column Totals
    const totalRow = ['Total'];
    let grandTotal = 0;
    yearRanges.forEach(r => {
      const count = columnTotals[r.label] || 0;
      totalRow.push(count);
      grandTotal += count;
    });
    totalRow.push(grandTotal);
    sheet.addRow(totalRow);

    // Send workbook
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=kender_yearly_report.xlsx');
    await workbook.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating Excel");
  }
};

