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
} = require("../config/roles");
const saadhakManagerRoles = [...prantRoles, ...zilaRoles, ...ksheterRoles, ...kenderRoles];
const attendanceRoles = [...kenderRoles, ...kenderTeamRoles];

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

router.get('/kender-team-rank', requireLogin, canManage(kenderRoles),attendanceController.kenderTeamRankReport);

router.get('/kender-team-rank/export-pdf', requireLogin, canManage(kenderRoles), attendanceController.exportKenderTeamRankPDF);


module.exports = router;


