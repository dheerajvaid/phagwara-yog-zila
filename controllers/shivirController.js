const ShivirRegistration = require("../models/ShivirRegistration");
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
