const express = require("express");
const router = express.Router();

const saadhakController = require("../controllers/saadhakController");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { checkSaadhakOwnership } = require("../middleware/ownershipMiddleware");

// ✅ Role groups from config
const { adminRoles, prantRoles, zilaRoles, ksheterRoles, kenderRoles, kenderTeamRoles } = require("../config/roles");

// ✅ Unified allowed roles for Saadhak management
const allowedRoles = [...adminRoles, ...prantRoles, ...zilaRoles, ...ksheterRoles, ...kenderRoles, ...kenderTeamRoles];

// Manage all Saadhaks
router.get(
  "/saadhak/manage",
  requireLogin,
  canManage(allowedRoles),
  saadhakController.listSaadhaks
);

// Add New Saadhak
router.get(
  "/saadhak/add",
  requireLogin,
  canManage(allowedRoles),
  saadhakController.showAddForm
);

router.post(
  "/saadhak/add",
  requireLogin,
  canManage(allowedRoles),
  saadhakController.createSaadhak
);

// Edit Saadhak
router.get(
  "/saadhak/edit/:id",
  requireLogin,
  canManage(allowedRoles),
  checkSaadhakOwnership,
  saadhakController.showEditForm
);
router.post(
  "/saadhak/edit/:id",
  requireLogin,
  canManage(allowedRoles),
  checkSaadhakOwnership,
  saadhakController.updateSaadhak
);

// Delete Saadhak
router.get(
  "/saadhak/delete/:id",
  requireLogin,
  canManage(allowedRoles),
  checkSaadhakOwnership,
  saadhakController.deleteSaadhak
);

module.exports = router;
