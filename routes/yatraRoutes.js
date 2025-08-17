const express = require("express");
const router = express.Router();
const Saadhak = require("../models/Saadhak");
const Yatra = require("../models/Yatra");
const moment = require("moment");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");

// Root: /vrindavan-trip
router.get("/", (req, res) => {
  res.render("yatra/password");
});

// If someone tries to access /unlock directly via GET, redirect to password page
router.get("/unlock", (req, res) => {
  return res.redirect("/vrindavan-trip");
});

// POST: /vrindavan-trip/unlock
router.post("/unlock", (req, res) => {
  const { password } = req.body;
  if (password === "krishna") {
    return res.render("yatra/form");
  } else {
    return res.render("yatra/password", { error: "Incorrect Password" });
  }
});

// POST: /vrindavan-trip/fetch

router.post("/fetch", async (req, res) => {
  const { mobile } = req.body;

  try {
    // 1️⃣ First try to find in Yatra
    const yatraData = await Yatra.findOne({ mobile });

    if (yatraData) {
      const age = moment().diff(moment(yatraData.dob), "years");

      return res.json({
        success: true,
        yatraData,
        age,
      });
    }

    // 2️⃣ If not found in Yatra, try Saadhak
    const saadhak = await Saadhak.findOne({ mobile });

    if (saadhak) {
      const age = moment().diff(moment(saadhak.dob), "years");

      return res.json({
        success: true,
        saadhak,
        age,
      });
    }

    // 3️⃣ Not found in either
    return res.json({
      success: false,
      message: "Saadhak not found in Yatra or Saadhak DB",
    });
  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: "Server error" });
  }
});

// POST: /vrindavan-trip/register
// POST: /vrindavan-trip/register
router.post("/register", async (req, res) => {
  try {
    const data = req.body;

    // Convert DOB string (YYYY-MM-DD) to local Date
    if (data.dob) {
      const [year, month, day] = data.dob.split("-");
      data.dob = new Date(year, month - 1, day); // JS months are 0-indexed
    }

    await Yatra.findOneAndUpdate(
      { mobile: data.mobile }, // filter
      data, // data to update
      { upsert: true, new: true } // create if not exists, return new doc
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Error saving registration" });
  }
});

// GET: /vrindavan-trip/success
router.get("/success", (req, res) => {
  res.render("yatra/success");
});

// Catch-all for /vrindavan-trip/*
// router.get('/*', (req, res) => {
//   res.redirect('/vrindavan-trip');
// });

// -------------------------
// Render Report Page
// -------------------------
// GET /vrindavan-trip/report
router.get("/report", async (req, res) => {
  try {
    const allYatra = await Yatra.find().sort({ registeredAt: 1 });

    // 🔢 Summary Calculations
    const totalBooked = allYatra.length;
    const seatCapacity = 60;
    const seatsLeft = seatCapacity - totalBooked;

    const maleCount = allYatra.filter((y) => y.gender === "Male").length;
    const femaleCount = allYatra.filter((y) => y.gender === "Female").length;

    const sleeperCount = allYatra.filter(
      (y) => y.seatType === "Sleeper"
    ).length;
    const ac3Count = allYatra.filter((y) => y.seatType === "3AC").length;

    res.render("yatra/report", {
      yatraList: allYatra,
      moment,
      summary: {
        totalBooked,
        seatsLeft,
        maleCount,
        femaleCount,
        sleeperCount,
        ac3Count,
      },
    });
  } catch (err) {
    console.error(err);
    res.send("Error loading report");
  }
});

// -------------------------
// PDF Export
// -------------------------

router.get("/report/pdf", async (req, res) => {
  try {
    const allYatra = await Yatra.find().sort({ registeredAt: 1 });

    // 📊 Summary values
    const totalBooked = allYatra.length;
    const seatCapacity = 60;
    const seatsLeft = seatCapacity - totalBooked;
    const maleCount = allYatra.filter((y) => y.gender === "Male").length;
    const femaleCount = allYatra.filter((y) => y.gender === "Female").length;
    const sleeperCount = allYatra.filter(
      (y) => y.seatType === "Sleeper"
    ).length;
    const ac3Count = allYatra.filter((y) => y.seatType === "3AC").length;

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Vrindavan_Yatra_Report.pdf"'
    );

    doc.pipe(res);

    // ------------------ HEADER ------------------
    doc
      .fontSize(18)
      .fillColor("#dc3545")
      .text("BHARTIYA YOG SANSTHAN (Regd.)", { align: "center" });

    doc
      .moveDown()
      .fontSize(14)
      .fillColor("black")
      .text("Vrindavan Yatra Report", { align: "center" });

    doc
      .fontSize(10)
      .text(`Generated on: ${moment().format("DD-MM-YYYY HH:mm")}`, {
        align: "center",
      });

    doc.moveDown(2);

    // ------------------ BOXED SUMMARY ------------------
    const boxStartX = 40;
    const boxStartY = doc.y;
    const boxWidth = 240;
    const boxHeight = 50;
    const spacing = 20;
    const rowSpacing = 60;

    const summaryBoxes = [
      { title: "Seats Booked", value: totalBooked, color: "#198754" }, // green
      { title: "Seats Left", value: seatsLeft, color: "#ffc107" }, // yellow
      { title: "Male", value: maleCount, color: "#0d6efd" }, // blue
      { title: "Female", value: femaleCount, color: "#dc3545" }, // red
      { title: "3AC", value: ac3Count, color: "#0dcaf0" }, // cyan
      { title: "Sleeper", value: sleeperCount, color: "#6c757d" }, // gray
    ];

    for (let i = 0; i < summaryBoxes.length; i++) {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const x = boxStartX + col * (boxWidth + spacing);
      const y = boxStartY + row * rowSpacing;

      // Draw colored box
      doc
        .lineWidth(1)
        .rect(x, y, boxWidth, boxHeight)
        .strokeColor(summaryBoxes[i].color)
        .stroke();

      // Title (Bold + Centered)
      doc
        .font("Helvetica-Bold") // 👈 Bold font
        .fontSize(12)
        .fillColor(summaryBoxes[i].color)
        .text(summaryBoxes[i].title, x, y + 10, {
          width: boxWidth,
          align: "center",
        });

      // Value (Bold + Centered + Bigger)
      doc
        .font("Helvetica-Bold") // 👈 Bold font
        .fontSize(18)
        .fillColor("black")
        .text(summaryBoxes[i].value.toString(), x, y + 30, {
          width: boxWidth,
          align: "center",
        });
    }

    // move cursor below boxes
    doc.moveDown(2);

    // ------------------ TABLE ------------------
    const headers = [
      "S.No",
      "Name",
      "Mobile",
      "Gender",
      "Age",
      "Seat",
      "Status",
      "Payment",
    ];
    const columnWidth = [40, 100, 90, 50, 40, 60, 70, 60];
    let y = doc.y;
    const rowHeight = 20;

    // Table Header
    doc
      .fontSize(10)
      .fillColor("white")
      .rect(40, y, 510, rowHeight)
      .fill("#dc3545");
    let x = 40;
    headers.forEach((h, i) => {
      doc
        .fillColor("white")
        .text(h, x + 2, y + 5, { width: columnWidth[i], align: "center" });
      x += columnWidth[i];
    });

    y += rowHeight;

    
    // Table Rows
    allYatra.forEach((yatra, index) => {
      const age = yatra.dob ? moment().diff(moment(yatra.dob), "years") : "";
      const row = [
        index + 1,
        yatra.name || "",
        yatra.mobile || "",
        yatra.gender || "",
        age,
        yatra.seatType || "",
        "Registered",
        "None",
      ];

      // Alternate row background
      const bgColor = index % 2 === 0 ? "#f1f1f1" : "#ffffff"; // light gray and white
      doc.save(); // Save current graphics state
      doc.fillColor(bgColor).rect(40, y, 510, rowHeight).fill();
      doc.restore(); // Restore to reset fillColor for text

      // Draw row text
      let x = 40;
      doc.fontSize(10).fillColor("black"); // Reset text color
      row.forEach((cell, i) => {
        doc.text(cell.toString(), x + 2, y + 5, {
          width: columnWidth[i],
          align: "center",
        });
        x += columnWidth[i];
      });

      y += rowHeight;

      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    // ------------------ INSTRUCTIONS ------------------
    doc.addPage();
    doc
      .fontSize(12)
      .fillColor("#dc3545")
      .text("Important Instructions", { underline: true });

    const instructions = [
      "1. Final travel list will be shared before 15th October.",
      "2. For changes or corrections, contact the team before 30th September.",
      "3. Carry original government ID proof during travel.",
      "4. Seat confirmation is based on final payment and ID verification.",
    ];

    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("black");
    instructions.forEach((instruction) => {
      doc.text(instruction);
    });

    doc.end();
  } catch (err) {
    console.error(err);
    res.send("Error generating PDF");
  }
});

// -------------------------
// Excel Export
// -------------------------
router.get("/report/excel", async (req, res) => {
  try {
    const allYatra = await Yatra.find().sort({ registeredAt: 1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Vrindavan Yatra");

    // Columns
    sheet.columns = [
      { header: "S.No", key: "sno", width: 6 },
      { header: "Name", key: "name", width: 20 },
      { header: "Mobile", key: "mobile", width: 15 },
      { header: "Gender", key: "gender", width: 8 },
      { header: "Age", key: "age", width: 6 },
      { header: "Seat", key: "seat", width: 10 },
      { header: "Status", key: "status", width: 12 },
      { header: "Payment", key: "payment", width: 12 },
    ];

    // Add rows
    allYatra.forEach((yatra, index) => {
      const age = yatra.dob ? moment().diff(moment(yatra.dob), "years") : "";
      sheet.addRow({
        sno: index + 1,
        name: yatra.name || "",
        mobile: yatra.mobile || "",
        gender: yatra.gender || "",
        age,
        seat: yatra.seatType || "",
        status: "Registered",
        payment: "None",
      });
    });

    // Styling header
    sheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
    sheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FFDC3545" },
    };

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="Vrindavan_Yatra_Report.xlsx"'
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error(err);
    res.send("Error generating Excel");
  }
});

module.exports = router;

module.exports = router;
