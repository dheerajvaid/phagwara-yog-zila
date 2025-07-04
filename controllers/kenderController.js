const fs = require("fs");
const path = require("path");
const { createCanvas } = require("canvas");
const archiver = require("archiver");

const Kender = require("../models/Kender");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Saadhak = require("../models/Saadhak");
const Attendance = require("../models/Attendance");
const { formatName, validateName } = require("../utils/formatters");
const drawCard = require("../helpers/drawCard");
const messages = require("../data/messages.json");

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

// ✅ Show Add Form
exports.showAddForm = async (req, res) => {
  try {
    const user = req.session.user;

    let zilas = [];
    let ksheters = [];

    if (user.roles.includes("Admin")) {
      // Admin can see all
      zilas = await Zila.find().sort({ name: 1 });
      ksheters = await Ksheter.find().sort({ name: 1 }).populate("zila");
    } else {
      const saadhak = await Saadhak.findById(user.id)
        .populate("zila")
        .populate("ksheter");

      if (!saadhak) {
        return res.status(400).send("❌ Saadhak data not found.");
      }

      if (
        user.roles.includes("Zila Pradhan") ||
        user.roles.includes("Zila Mantri")
      ) {
        // Zila team - see their Zila, all Ksheter under Zila
        if (saadhak.zila) {
          zilas = [saadhak.zila];
          ksheters = await Ksheter.find({ zila: saadhak.zila._id }).populate(
            "zila"
          );
        }
      } else if (
        user.roles.includes("Ksheter Pradhan") ||
        user.roles.includes("Ksheter Mantri")
      ) {
        // Ksheter team - see only their Ksheter
        if (saadhak.zila && saadhak.ksheter) {
          zilas = [saadhak.zila];
          ksheters = [saadhak.ksheter];
        }
      }
    }

    res.render("kender/add", {
      zilas: await Zila.find().sort({ name: 1 }),
      ksheters: await Ksheter.find().sort({ name: 1 }),
      formData: {}, // for sticky form
      error: null,
      user: req.session.user,
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
    const { name, address, zila, ksheter, startTime } = req.body;
    const user = req.session.user;

    const formData = { name, address, zila, ksheter, startTime };

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
    if (!validateName(name)) {
      const zilas = await Zila.find();
      const ksheters = await Ksheter.find({ zila });
      return res.render("kender/add", {
        error: "❌ Kender name must contain only alphabets and numbers.",
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

    const newKender = new Kender({
      name: formattedName,
      address: formattedAddress,
      zila,
      ksheter,
      startTime: startTime?.trim() || undefined, // Optional field
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

    res.render("kender/list", {
      kenders,
      zilas: allZilas,
      ksheters: allKsheters,
      selectedZila,
      selectedKsheter,
      user,
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

    if (user.roles.includes("Admin")) {
      // Admin: All Zila and Ksheter
      zilas = await Zila.find().sort({ name: 1 });
      ksheters = await Ksheter.find().sort({ name: 1 });
    } else {
      // Non-admin: fetch user's assigned zila/ksheter
      const saadhak = await Saadhak.findById(user.id).populate("zila ksheter");

      if (!saadhak) {
        return res.status(400).send("❌ Saadhak not found.");
      }

      if (
        user.roles.includes("Zila Pradhan") ||
        user.roles.includes("Zila Mantri")
      ) {
        if (saadhak.zila) {
          zilas = [saadhak.zila];
          ksheters = await Ksheter.find({ zila: saadhak.zila._id });
        }
      } else if (
        user.roles.includes("Ksheter Pradhan") ||
        user.roles.includes("Ksheter Mantri")
      ) {
        if (saadhak.zila && saadhak.ksheter) {
          zilas = [saadhak.zila];
          ksheters = [saadhak.ksheter];
        }
      }
    }
    console.log(zilas);
    // ✅ Add `user` to the render context
    res.render("kender/edit", {
      kender,
      zilas,
      ksheters,
      error: null,
      user, // important!
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
    const { name, ksheter, zila, address, startTime } = req.body;
    const user = req.session.user;
    const kenderId = req.params.id;

    const kender = await Kender.findById(kenderId).populate("zila ksheter");

    if (!name || !ksheter || !zila || !address) {
      const zilas = await Zila.find().sort({ name: 1 });
      const ksheters = await Ksheter.find({ zila }).sort({ name: 1 });

      return res.render("kender/edit", {
        kender,
        zilas,
        ksheters,
        error: "❌ All fields are required.",
        user,
      });
    }

    if (!validateName(name)) {
      const zilas = await Zila.find().sort({ name: 1 });
      const ksheters = await Ksheter.find({ zila }).sort({ name: 1 });

      return res.render("kender/edit", {
        kender,
        zilas,
        ksheters,
        error: "❌ Kender name must contain only alphabets and spaces.",
        user,
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

      return res.render("kender/edit", {
        kender,
        zilas,
        ksheters,
        error:
          "⚠️ A Kender with this name already exists under the selected Zila and Ksheter.",
        user,
      });
    }

    // ✅ Update Kender (with startTime)
    await Kender.findByIdAndUpdate(kenderId, {
      name: formattedName,
      address: formattedAddress,
      ksheter,
      zila,
      startTime: startTime?.trim() || undefined,
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
