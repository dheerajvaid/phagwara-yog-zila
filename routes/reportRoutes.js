const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const { requireLogin } = require('../middleware/authMiddleware');

router.get('/summary', requireLogin, reportController.teamSummary);

router.get('/attendance-summary', reportController.attendanceSummary);

module.exports = router;