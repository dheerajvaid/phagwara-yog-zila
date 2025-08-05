const express = require("express");
const router = express.Router();
const kenderController = require("../controllers/kenderController");
const { checkKenderOwnership } = require("../middleware/ownershipMiddleware");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { adminRoles, prantRoles, zilaRoles, ksheterRoles, kenderRoles } = require('../config/roles'); // ✅ DRY import
const allowedRoles = [...adminRoles, ...prantRoles, ...zilaRoles, ...ksheterRoles];

// Routes
router.get(
  "/kender/manage",
  requireLogin,
  canManage(allowedRoles),
  kenderController.listKenders
);

router.get(
  "/kender/add",
  requireLogin,
  canManage(allowedRoles),
  kenderController.showAddForm
);

router.post(
  "/kender/add",
  requireLogin,
  canManage(allowedRoles),
  kenderController.createKender
);

router.get(
  "/kender/edit/:id",
  requireLogin,
  canManage(allowedRoles),
  checkKenderOwnership,
  kenderController.showEditForm
);

router.post(
  "/kender/edit/:id",
  requireLogin,
  canManage(allowedRoles),
  checkKenderOwnership,
  kenderController.updateKender
);

router.get(
  "/kender/delete/:id",
  requireLogin,
  canManage(allowedRoles),
  kenderController.deleteKender
);

// Step 1: Show print interface
router.get(
  "/kender/print-cards",
  requireLogin,
  canManage(kenderRoles),
  kenderController.showPrintPage
);

// Step 2: Handle generation of ZIP
router.post(
  "/kender/print-cards",
  requireLogin,
  canManage(kenderRoles),
  kenderController.generateCardsZip
);

// Public fetch by Ksheter
router.get(
  "/kender/by-ksheter/:id",
  requireLogin,
  kenderController.listByKsheter
);

router.get("/kender/print-cards/data", requireLogin, canManage(kenderRoles), kenderController.getSaadhakCardData);

router.get('/api/kenders/by-ksheter/:ksheterId', async (req, res) => {
  const kenderList = await Kender.find({ ksheter: req.params.ksheterId }).sort({ name: 1 }).lean();
  res.json(kenderList);
});

module.exports = router;
