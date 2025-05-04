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

exports.exportZilaPDF = async (req, res) => {
  const zila = await Zila.findById(req.params.id);
  const zilaTeam = await Saadhak.find({
    zila: zila._id,
    role: {
      $in: ["Zila Pradhan", "Zila Mantri", "Sangathan Mantri", "Cashier"],
    },
  });

  const ksheters = await Ksheter.find({ zila: zila._id });
  const kenders = await Kender.find({ zila: zila._id });

  const allTeam = await Saadhak.find({ zila: zila._id });

  // Group data
  const teamByKsheter = {};
  const kendersByKsheter = {};
  const teamByKender = {};

  ksheters.forEach((k) => {
    teamByKsheter[k._id] = allTeam.filter(
      (s) =>
        s.ksheter?.toString() === k._id.toString() &&
        s.role.some((r) => r.includes("Ksheter"))
    );
    kendersByKsheter[k._id] = kenders.filter(
      (ken) => ken.ksheter?.toString() === k._id.toString()
    );
  });

  kenders.forEach((k) => {
    teamByKender[k._id] = allTeam.filter(
      (s) =>
        s.kender?.toString() === k._id.toString() &&
        ["Kender Pramukh", "Seh Kender Pramukh", "Shikshak", "Karyakarta"].some(
          (role) => s.role.includes(role)
        )
    );
  });

  const html = await ejs.renderFile(
    path.join(__dirname, "../views/export/zila-pdf.ejs"),
    {
      zila,
      zilaTeam,
      ksheters,
      teamByKsheter,
      kendersByKsheter,
      teamByKender,
    }
  );

  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  res.contentType("application/pdf");
  res.send(pdf);
};

exports.exportKsheterPDF = async (req, res) => {
  const ksheter = await Ksheter.findById(req.params.id).populate("zila");
  const kenders = await Kender.find({ ksheter: ksheter._id });
  const team = await Saadhak.find({
    ksheter: ksheter._id,
    role: { $in: ["Ksheter Pradhan", "Ksheter Mantri"] },
  });

  const html = await ejs.renderFile(
    path.join(__dirname, "../views/export/ksheter-pdf.ejs"),
    {
      ksheter,
      kenders,
      team,
    }
  );

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  res.contentType("application/pdf");
  res.send(pdf);
};

exports.exportKenderPDF = async (req, res) => {
  const kender = await Kender.findById(req.params.id)
    .populate("ksheter")
    .populate("zila");
  const team = await Saadhak.find({
    kender: kender._id,
    role: {
      $in: ["Kender Pramukh", "Seh Kender Pramukh", "Shikshak", "Karyakarta"],
    },
  });

  const html = await ejs.renderFile(
    path.join(__dirname, "../views/export/kender-pdf.ejs"),
    {
      kender,
      team,
    }
  );

  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdf = await page.pdf({ format: "A4", printBackground: true });
  await browser.close();

  res.contentType("application/pdf");
  res.send(pdf);
};

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
