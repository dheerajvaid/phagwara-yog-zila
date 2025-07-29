const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireLogin } = require('../middleware/authMiddleware');

router.get('/summary', requireLogin, reportController.teamSummary);

// 🔹 Filter form page
router.get('/attendance-filter', requireLogin, reportController.attendanceFilterPage);

// 🔹 Summary result page (after filter)
router.get('/attendance-summary', requireLogin, reportController.attendanceSummary);

module.exports = router;
