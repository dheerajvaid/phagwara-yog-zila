const express = require("express");
const router = express.Router();

const ksheterController = require("../controllers/ksheterController");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { canManageKsheter } = require("../middleware/ownershipMiddleware");
const { adminRoles, prantRoles, zilaRoles } = require('../config/roles'); // ✅ DRY import
const allowedRoles = [...adminRoles, ...prantRoles, ...zilaRoles];


// 🗂️ Manage all Ksheter (Admin + Zila Team)
router.get(
  "/ksheter/manage",
  requireLogin,
  canManage(allowedRoles),
  ksheterController.listKsheter
);

// ➕ Add Ksheter
router
  .route("/ksheter/add")
  .get(requireLogin, canManage(allowedRoles), ksheterController.showAddForm)
  .post(requireLogin, canManage(allowedRoles), ksheterController.createKsheter);

// 🖊️ Edit Ksheter
router
  .route("/ksheter/edit/:id")
  .get(requireLogin, canManage(allowedRoles), canManageKsheter, ksheterController.showEditForm)
  .post(requireLogin, canManage(allowedRoles), canManageKsheter, ksheterController.updateKsheter);

// 🗑️ Delete Ksheter
router.get(
  "/ksheter/delete/:id",
  requireLogin,
  canManage(allowedRoles),
  canManageKsheter,
  ksheterController.deleteKsheter
);

router.get('/api/ksheters/by-zila/:zilaId', async (req, res) => {
  const ksheterList = await Ksheter.find({ zila: req.params.zilaId }).sort({ name: 1 }).lean();
  res.json(ksheterList);
});

module.exports = router;
