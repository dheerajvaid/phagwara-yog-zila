// ✅ Required part in POST and PUT is marked with comments.

const express = require("express");
const router = express.Router();
const calendarController = require("../controllers/calendarController");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { adminOnly } = require("../config/roles");

// routes/eventRoutes.js
router.get('/today', calendarController.viewUpcomingEvents);

module.exports = router;
