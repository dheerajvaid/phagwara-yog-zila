const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendanceController");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { zilaRoles, ksheterRoles, kenderRoles, saadhakRoles } = require("../config/roles");
const saadhakManagerRoles = [...zilaRoles, ...ksheterRoles, ...kenderRoles];
const attendanceRoles =[...kenderRoles, ...saadhakRoles];

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
  canManage(saadhakManagerRoles),
  attendanceController.getAttendanceByDate
); // ✅ This returns JSON

module.exports = router;
