const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const {
  prantRoles,
  zilaRoles,
  ksheterRoles,
  kenderRoles,
  kenderTeamRoles,
  adminRoles,
} = require("../config/roles");
const saadhakManagerRoles = [
  ...prantRoles,
  ...zilaRoles,
  ...ksheterRoles,
  ...kenderRoles,
];
const attendanceRoles = [...kenderRoles, ...kenderTeamRoles];

const PDFDocument = require("pdfkit");
const moment = require("moment-timezone");

const Saadhak = require("../models/Saadhak");
const Attendance = require("../models/Attendance");
const Kender = require("../models/Kender");

// Show form to mark attendance
router.get(
  "/mark",
  requireLogin,
  canManage(attendanceRoles),
  attendanceController.showMarkAttendanceForm
);

// Submit attendance
router.post(
  "/mark",
  requireLogin,
  canManage(attendanceRoles),
  attendanceController.markAttendance
);

// View today's attendance
router.get(
  "/today",
  requireLogin,
  canManage(attendanceRoles),
  attendanceController.viewTodayAttendance
);

// Show attendance records for a specific date
router.get(
  "/reports/:date",
  requireLogin,
  canManage(saadhakManagerRoles),
  attendanceController.showAttendanceReport
);

router.get(
  "/reports/kender/:kenderId",
  requireLogin,
  canManage(saadhakManagerRoles),
  attendanceController.reportByKender
);

router.get(
  "/reports/full/:date",
  requireLogin,
  canManage(saadhakManagerRoles),
  attendanceController.fullReportByDate
);

router.get(
  "/reports/filter",
  requireLogin,
  canManage(saadhakManagerRoles),
  attendanceController.filteredAttendanceForm
);

router.post(
  "/reports/filter",
  requireLogin,
  canManage(saadhakManagerRoles),
  attendanceController.filteredAttendanceResult
);

// routes/attendance.js or controller
router.get(
  "/by-date",
  requireLogin,
  canManage(attendanceRoles),
  attendanceController.getAttendanceByDate
); // ✅ This returns JSON

// GET view form and report
router.get(
  "/view",
  requireLogin,
  canManage(saadhakManagerRoles),
  attendanceController.viewAttendance
);

router.get(
  "/view-kender",
  requireLogin,
  canManage(saadhakManagerRoles),
  attendanceController.viewKenderWiseAttendance
);

router.get(
  "/top10",
  requireLogin,
  canManage(saadhakManagerRoles),
  attendanceController.viewTop10Attendance
);

// View filter form and results
router.get(
  "/missing",
  requireLogin,
  canManage(saadhakManagerRoles),
  attendanceController.getMissingForm
);
router.post(
  "/missing/report",
  requireLogin,
  canManage(saadhakManagerRoles),
  attendanceController.generateMissingReport
);

// Export PDF
router.get(
  "/export/pdf/missing",
  requireLogin,
  canManage(saadhakManagerRoles),
  attendanceController.exportMissingPDF
);

router.get(
  "/kender-team-rank",
  requireLogin,
  canManage(kenderRoles),
  attendanceController.kenderTeamRankReport
);

router.get(
  "/kender-team-rank/export-pdf",
  requireLogin,
  canManage(kenderRoles),
  attendanceController.exportKenderTeamRankPDF
);

router.get(
  "/details/:saadhakId",
  requireLogin,
  canManage(saadhakManagerRoles),
  attendanceController.viewIndividualAttendance
);

router.get("/report/pdf/:saadhakId", async (req, res) => {
  const { saadhakId } = req.params;
  const { month, year } = req.query;

  try {
    const saadhak = await Saadhak.findById(saadhakId).populate("kender");
    if (!saadhak) return res.status(404).send("Saadhak not found");

    const selectedMonth = parseInt(month);
    const selectedYear = parseInt(year);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const startDate = new Date(
      `${selectedYear}-${String(selectedMonth).padStart(2, "0")}-01`
    );

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
        : new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999);

    const attendanceRecords = await Attendance.find({
      saadhak: saadhakId,
      date: { $gte: startDate, $lte: endDate },
    }).populate("kender");

    const dailyVisits = {};
    attendanceRecords.forEach((rec) => {
      const dateKey = moment(rec.date).format("YYYY-MM-DD");
      dailyVisits[dateKey] = {
        dateStr: moment(rec.date).format("DD-MMM-YY (ddd)"),
        kenderName: rec.kender?.name || "Unknown",
      };
    });

    const kenderVisitCount = {};
    Object.values(dailyVisits).forEach(({ kenderName }) => {
      kenderVisitCount[kenderName] = (kenderVisitCount[kenderName] || 0) + 1;
    });

    const doc = new PDFDocument({ margin: 20, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${saadhak.name}_attendance_${month}-${year}.pdf"`
    );

    doc.pipe(res);

    // Header
    doc
      .moveDown(0.2)
      .fontSize(13)
      .fillColor("black")
      .font("Helvetica-Bold")
      .text(`Attendance Report - ${moment(startDate).format("MMMM YYYY")}`, {
        align: "center",
      });

    doc.moveDown(0.3);

    // Saadhak Info Box
    doc
      .rect(40, doc.y, 520, 40)
      .fillOpacity(0.05)
      .fillAndStroke("#e6f2ff", "#0d6efd");

    doc.fillOpacity(1).fontSize(11).fillColor("black").font("Helvetica");
    doc.text(`Name: ${saadhak.name}`, 50, doc.y + 8);
    doc.text(
      `Total Days Present: ${Object.keys(dailyVisits).length} Day${
        Object.keys(dailyVisits).length > 1 ? "s" : ""
      }`,
      50,
      doc.y + 5
    );

    doc.moveDown(0.3);

    // Kender-wise Summary Heading
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#0d6efd")
      .text("Kender-wise Attendance Summary", {
        underline: true,
        align: "center",
      });

    doc.moveDown(0.3);

    if (Object.keys(kenderVisitCount).length === 0) {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("black")
        .text("No attendance recorded.");
    } else {
      const tableStartX = 50;
      const tableStartY = doc.y;
      const col1Width = 300;
      const col2Width = 100;
      const rowHeight = 16;

      // Header row
      doc
        .rect(tableStartX, tableStartY, col1Width + col2Width, rowHeight)
        .fill("#e6f0ff");

      doc
        .fillColor("#0d6efd")
        .font("Helvetica-Bold")
        .fontSize(11)
        .text("Kender Name", tableStartX + 10, tableStartY + 4)
        .text("Days Present", tableStartX + col1Width + 10, tableStartY + 4);

      let y = tableStartY + rowHeight;

      Object.entries(kenderVisitCount).forEach(([kenderName, count], index) => {
        const rowColor = index % 2 === 0 ? "#f9f9f9" : "#ffffff";
        doc
          .rect(tableStartX, y, col1Width + col2Width, rowHeight)
          .fill(rowColor);

        doc
          .fillColor("#f00")
          .font("Helvetica")
          .fontSize(10)
          .text(kenderName, tableStartX + 10, y + 4)
          .text(
            `${count} Day${count > 1 ? "s" : ""}`,
            tableStartX + col1Width + 10,
            y + 4
          );

        y += rowHeight;

        if (y > 720) {
          doc.addPage();
          y = 50;
        }
      });

      doc.moveDown(1.2);
    }

    // Daily Attendance Table
    let daysInMonth = moment(`${year}-${month}`, "YYYY-MM").daysInMonth();
    if (selectedMonth === currentMonth && selectedYear === currentYear) {
      daysInMonth = now.getDate();
    }

    const startX = 50;
    let currentY = doc.y;

    for (let i = 1; i <= daysInMonth; i++) {
      const dateObj = moment(`${year}-${month}-${i}`, "YYYY-MM-DD");
      const dateKey = dateObj.format("YYYY-MM-DD");
      const formattedDate = dateObj.format("DD-MMM-YY (ddd)");
      const kenderName = dailyVisits[dateKey]?.kenderName || "Absent";

      doc.lineWidth(0.4).rect(startX, currentY, 500, 16).stroke("#cccccc");

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("black")
        .text(formattedDate, startX + 10, currentY + 3);

      if (kenderName === "Absent") {
        doc.fillColor("#ff4d4d").text("---", startX + 200, currentY + 3);
      } else {
        doc.fillColor("#00f").text(`${kenderName}`, startX + 200, currentY + 3);
      }

      currentY += 17;

      if (currentY > 720) {
        doc.addPage();
        currentY = 50;
      }
    }

    // Footer
    doc
      .moveDown(1.5)
      .fontSize(9)
      .fillColor("gray")
      .text(
        `Generated on: ${moment().tz("Asia/Kolkata").format("DD-MMM-YYYY HH:mm")}`,
        { align: "right" }
      );

    doc.end();
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating PDF");
  }
});

router.get(
  "/ksheterwise",
  requireLogin,
  canManage([...adminRoles, ...prantRoles, ...zilaRoles, ...ksheterRoles]),
  attendanceController.viewKsheterWiseAttendance
);

// Export Excel for missing attendance
router.get(
  "/export/excel/missing",
  requireLogin,
  canManage(saadhakManagerRoles),
  attendanceController.exportMissingExcel
);

module.exports = router;
