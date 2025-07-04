const express = require("express");
const router = express.Router();
const kenderController = require("../controllers/kenderController");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { checkKenderOwnership } = require("../middleware/ownershipMiddleware");
const { ksheterRoles, kenderMainRoles } = require("../config/roles"); // ✅ DRY import

// Routes
router.get(
  "/kender/manage",
  requireLogin,
  canManage(ksheterRoles),
  kenderController.listKenders
);

router.get(
  "/kender/add",
  requireLogin,
  canManage(ksheterRoles),
  kenderController.showAddForm
);

router.post(
  "/kender/add",
  requireLogin,
  canManage(ksheterRoles),
  kenderController.createKender
);

router.get(
  "/kender/edit/:id",
  requireLogin,
  canManage(ksheterRoles),
  checkKenderOwnership,
  kenderController.showEditForm
);

router.post(
  "/kender/edit/:id",
  requireLogin,
  canManage(ksheterRoles),
  checkKenderOwnership,
  kenderController.updateKender
);

router.get(
  "/kender/delete/:id",
  requireLogin,
  canManage(ksheterRoles),
  kenderController.deleteKender
);

// Step 1: Show print interface
router.get(
  "/kender/print-cards",
  requireLogin,
  canManage(kenderMainRoles),
  kenderController.showPrintPage
);

// Step 2: Handle generation of ZIP
router.post(
  "/kender/print-cards",
  requireLogin,
  canManage(kenderMainRoles),
  kenderController.generateCardsZip
);

// Public fetch by Ksheter
router.get(
  "/kender/by-ksheter/:id",
  requireLogin,
  kenderController.listByKsheter
);

router.get("/kender/print-cards/data", requireLogin, canManage(kenderMainRoles), kenderController.getSaadhakCardData);


module.exports = router;
