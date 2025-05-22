const ShivirRegistration = require("../models/ShivirRegistration");
const ShivirAttendance = require("../models/ShivirAttendance");
const { Parser } = require("json2csv"); // for CSV export
const moment = require("moment");

exports.getForm = (req, res) => {
  res.render("shivir/register", { success: null, error: null });
};

exports.postForm = async (req, res) => {
  try {
    const { name, mobile, gender, age, address, disease, bysMember } = req.body;

    if (!name || !mobile || !gender || !age || !address || !bysMember) {
      return res.render("shivir/register", {
        error: "Please fill all required fields.",
        success: null,
      });
    }

    // 🔍 Check if the mobile number already exists
    const existingEntry = await ShivirRegistration.findOne({ mobile });

    if (existingEntry) {
      return res.render("shivir/register", {
        error: "This mobile number is already registered.",
        success: null,
      });
    }

    // ✅ Create new entry
    await ShivirRegistration.create({
      name,
      mobile,
      gender,
      age,
      address,
      disease,
      bysMember,
    });

    res.render("shivir/register", {
      success: "Thank you! Your registration was successful.",
      error: null,
    });
  } catch (err) {
    console.error(err);
    res.render("shivir/register", {
      error: "Something went wrong. Please try again later.",
      success: null,
    });
  }
};

exports.listRegistrations = async (req, res) => {
  try {
    const registrations = await ShivirRegistration.find().sort({
      registeredAt: 1,
    });
    const entries = await ShivirRegistration.find();

    const summary = {
      total: entries.length,
      male: 0,
      female: 0,
      maleAgeSlabs: {
        below20: 0,
        between20_40: 0,
        between40_60: 0,
        between60_80: 0,
        above80: 0,
      },
      femaleAgeSlabs: {
        below20: 0,
        between20_40: 0,
        between40_60: 0,
        between60_80: 0,
        above80: 0,
      },
    };

    for (const s of entries) {
      const gender = s.gender?.toLowerCase();
      const age = s.age;

      if (!gender || !age) continue;

      if (gender === "male") {
        summary.male++;
        if (age < 20) summary.maleAgeSlabs.below20++;
        else if (age <= 40) summary.maleAgeSlabs.between20_40++;
        else if (age <= 60) summary.maleAgeSlabs.between40_60++;
        else if (age <= 80) summary.maleAgeSlabs.between60_80++;
        else summary.maleAgeSlabs.above80++;
      }

      if (gender === "female") {
        summary.female++;
        if (age < 20) summary.femaleAgeSlabs.below20++;
        else if (age <= 40) summary.femaleAgeSlabs.between20_40++;
        else if (age <= 60) summary.femaleAgeSlabs.between40_60++;
        else if (age <= 80) summary.femaleAgeSlabs.between60_80++;
        else summary.femaleAgeSlabs.above80++;
      }
    }

    res.render("shivir/registrations", { summary, registrations, moment });
  } catch (err) {
    console.error(err);
    res.send("Error fetching registrations.");
  }
};

exports.exportRegistrations = async (req, res) => {
  try {
    const registrations = await ShivirRegistration.find().lean();

    const formatted = registrations.map((reg) => ({
      ...reg,
      registeredAt: moment(reg.registeredAt).format("DD-MM-YYYY hh:mm A"),
    }));

    const fields = [
      "name",
      "mobile",
      "gender",
      "age",
      "address",
      "disease",
      "bysMember",
      "registeredAt",
      "kenderName",
    ];
    const parser = new Parser({ fields });
    const csv = parser.parse(formatted);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=shivir-registrations.csv"
    );
    res.status(200).send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).send("Could not export data.");
  }
};

exports.deleteRegistration = async (req, res) => {
  try {
    await ShivirRegistration.findByIdAndDelete(req.params.id);
    res.redirect("/shivir/registrations");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting registration");
  }
};

exports.getAttendanceForm = async (req, res) => {
  // const today = moment().subtract(1, 'days').format("YYYY-MM-DD");
  const today = moment().format("YYYY-MM-DD");
  // console.log(today);

  // ✅ Only fetch records where present is true
  const attendance = await ShivirAttendance.find({ date: today, present: true })
    .collation({ locale: "en", strength: 1 }) // Case-insensitive collation
    .sort({ name: 1 });

  // 🔁 Build Set of registrationIds already marked present
  const markedIds = new Set(attendance.map((a) => a.registrationId.toString()));
  // console.log("Marked as present IDs:", markedIds);

  // ✅ Show registrations who are NOT in markedIds (i.e., not present yet)
  const registrations = await ShivirRegistration.find({
    _id: { $nin: Array.from(markedIds) },
  }).sort("name");

  res.render("shivir/attendance", {
    registrations,
    today,
  });
};

exports.postAttendance = async (req, res) => {
  // const today = moment().subtract(1, 'days').format("YYYY-MM-DD");
  const today = moment().format("YYYY-MM-DD");
  const presentIds = req.body.present || [];

  const allRegistrations = await ShivirRegistration.find();

  // Normalize presentIds to strings in case it's a single value
  const presentSet = new Set(
    Array.isArray(presentIds) ? presentIds : [presentIds]
  );

  // console.log("Present: ", presentSet);

  for (const reg of allRegistrations) {
    const regIdStr = reg._id.toString();
    const isPresent = presentSet.has(regIdStr);

    // Find if there's already an attendance record
    const existing = await ShivirAttendance.findOne({
      registrationId: reg._id,
      date: today,
      present: false,
    });

    if (existing) {
      if (existing.present !== isPresent) {
        existing.present = isPresent;
        await existing.save();
      }
    } else {
      await ShivirAttendance.create({
        registrationId: reg._id,
        date: today,
        present: isPresent,
      });
    }
  }

  res.redirect("/shivir/attendance/report");
};

exports.attendanceReport = async (req, res) => {
  const days = [
    "2025-05-21",
    "2025-05-22",
    "2025-05-23",
    "2025-05-24",
    "2025-05-25",
  ];
  const registrations = await ShivirRegistration.find()
    .collation({ locale: "en", strength: 1 }) // Case-insensitive collation
    .sort({ name: 1 });

  const attendanceData = {};

  for (let day of days) {
    const dayRecords = await ShivirAttendance.find({ date: day });
    const presentIds = new Set(
      dayRecords
        .filter((r) => r.present)
        .map((r) => r.registrationId.toString())
    );
    attendanceData[day] = presentIds;
  }

  res.render("shivir/report", {
    registrations,
    attendanceData,
    days,
  });
};
