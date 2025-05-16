const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");

// Show form to mark attendance
router.get("/mark", attendanceController.showMarkAttendanceForm);

// Submit attendance
router.post("/mark", attendanceController.markAttendance);

// View today's attendance
router.get("/today", attendanceController.viewTodayAttendance);

// Show attendance records for a specific date
router.get("/reports/:date", attendanceController.showAttendanceReport);

router.get("/reports/kender/:kenderId", attendanceController.reportByKender);

router.get("/reports/full/:date", attendanceController.fullReportByDate);

router.get("/reports/filter", attendanceController.filteredAttendanceForm);

router.post("/reports/filter", attendanceController.filteredAttendanceResult);

// routes/attendance.js or controller
router.get("/by-date", attendanceController.getAttendanceByDate); // ✅ This returns JSON



module.exports = router;
