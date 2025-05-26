// routes/shivir.js
const express = require("express");
const router = express.Router();
const shivirController = require("../controllers/shivirRegController");
const ShivirRegistration = require("../models/ShivirReg");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { ksheterRoles } = require("../config/roles"); // ✅ DRY import

// Create & Manage
router.get(
  "/create",
  requireLogin,
  canManage(ksheterRoles),
  shivirController.showCreateForm
);
router.post(
  "/create",
  requireLogin,
  canManage(ksheterRoles),
  shivirController.createShivir
);
router.get(
  "/manage",
  requireLogin,
  canManage(ksheterRoles),
  shivirController.manageShivirs
);

// Public
router.get("/upcoming", shivirController.listUpcomingShivirs);
router.get("/:id", shivirController.viewShivirDetail);
router.post("/:id/register", shivirController.registerForShivir);
router.get(
  "/:id/registrations",
  requireLogin,
  canManage(ksheterRoles),
  shivirController.viewRegistrations
);

module.exports = router;
