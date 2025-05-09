const express = require("express");
const router = express.Router();

const saadhakController = require("../controllers/saadhakController");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { checkSaadhakOwnership } = require("../middleware/ownershipMiddleware");

// ✅ Role groups from config
const { zilaRoles, ksheterRoles, kenderRoles } = require("../config/roles");

// ✅ Unified allowed roles for Saadhak management
const saadhakManagerRoles = [...zilaRoles, ...ksheterRoles, ...kenderRoles];

// Manage all Saadhaks
router.get(
  "/saadhak/manage",
  requireLogin,
  canManage(saadhakManagerRoles),
  saadhakController.listSaadhaks
);

// Add New Saadhak
router.get(
  "/saadhak/add",
  requireLogin,
  canManage(saadhakManagerRoles),
  saadhakController.showAddForm
);
router.post(
  "/saadhak/add",
  requireLogin,
  canManage(saadhakManagerRoles),
  saadhakController.createSaadhak
);

// Edit Saadhak
router.get(
  "/saadhak/edit/:id",
  requireLogin,
  canManage(saadhakManagerRoles),
  checkSaadhakOwnership,
  saadhakController.showEditForm
);
router.post(
  "/saadhak/edit/:id",
  requireLogin,
  canManage(saadhakManagerRoles),
  checkSaadhakOwnership,
  saadhakController.updateSaadhak
);

// Delete Saadhak
router.get(
  "/saadhak/delete/:id",
  requireLogin,
  canManage(saadhakManagerRoles),
  checkSaadhakOwnership,
  saadhakController.deleteSaadhak
);

module.exports = router;
