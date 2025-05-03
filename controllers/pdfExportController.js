const pdf = require("html-pdf");
const ejs = require("ejs");

const path = require("path");

const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const Saadhak = require("../models/Saadhak");

const ROLE_PRIORITY = [
  "Zila Pradhan",
  "Zila Mantri",
  "Sangathan Mantri",
  "Cashier",
  "Ksheter Pradhan",
  "Ksheter Mantri",
  "Kender Pramukh",
  "Seh Kender Pramukh",
  "Shikshak",
  "Karyakarta",
];


exports.exportAllPDF = async (req, res) => {
  try {
    const zilas = await Zila.find().sort({ name: 1 });
    const ksheters = await Ksheter.find().sort({ name: 1 });
    const kenders = await Kender.find().sort({ name: 1 });

    let saadhaks = await Saadhak.find()
      .populate("zila")
      .populate("ksheter")
      .populate("kender");

    // ✅ Sort based on highest priority role
    saadhaks = saadhaks.sort((a, b) => {
      const aPriority = Math.min(
        ...a.role.map((r) => ROLE_PRIORITY.indexOf(r)).filter((i) => i !== -1)
      );
      const bPriority = Math.min(
        ...b.role.map((r) => ROLE_PRIORITY.indexOf(r)).filter((i) => i !== -1)
      );
      return (
        (aPriority !== Infinity ? aPriority : 99) -
        (bPriority !== Infinity ? bPriority : 99)
      );
    });

    const html = await ejs.renderFile(
      path.join(__dirname, "../views/export/all-pdf.ejs"),
      {
        zilas,
        ksheters,
        kenders,
        saadhaks,
      }
    );

    const options = { format: "A4", border: "10mm" };

    pdf.create(html, options).toBuffer((err, buffer) => {
      if (err) {
        console.error("PDF Error:", err);
        return res.status(500).send("PDF generation failed.");
      }
      res.contentType("application/pdf");
      res.send(buffer);
    });
  } catch (err) {
    console.error("❌ PDF Export Error:", err);
    res.status(500).send("Server Error");
  }
};
