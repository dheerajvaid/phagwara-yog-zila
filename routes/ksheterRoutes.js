const express = require("express");
const router = express.Router();

const ksheterController = require("../controllers/ksheterController");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { canManageKsheter } = require("../middleware/ownershipMiddleware");

// Import roles
const { zilaRoles } = require("../config/roles");

// 🗂️ Manage all Ksheter (Admin + Zila Team)
router.get(
  "/ksheter/manage",
  requireLogin,
  canManage(zilaRoles),
  ksheterController.listKsheter
);

// ➕ Add Ksheter
router
  .route("/ksheter/add")
  .get(requireLogin, canManage(zilaRoles), ksheterController.showAddForm)
  .post(requireLogin, canManage(zilaRoles), ksheterController.createKsheter);

// 🖊️ Edit Ksheter
router
  .route("/ksheter/edit/:id")
  .get(requireLogin, canManage(zilaRoles), canManageKsheter, ksheterController.showEditForm)
  .post(requireLogin, canManage(zilaRoles), canManageKsheter, ksheterController.updateKsheter);

// 🗑️ Delete Ksheter
router.get(
  "/ksheter/delete/:id",
  requireLogin,
  canManage(zilaRoles),
  canManageKsheter,
  ksheterController.deleteKsheter
);

router.get('/api/ksheters/by-zila/:zilaId', async (req, res) => {
  const ksheterList = await Ksheter.find({ zila: req.params.zilaId }).sort({ name: 1 }).lean();
  res.json(ksheterList);
});

module.exports = router;
