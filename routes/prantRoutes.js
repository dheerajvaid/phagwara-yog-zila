const express = require("express");
const router = express.Router();
const prantController = require("../controllers/prantController");
const { requireLogin } = require("../middleware/authMiddleware");
const { adminRoles } = require("../config/roles");
const { canManage } = require("../middleware/roleMiddleware");

router.get(
  "/list",
  requireLogin,
  canManage(adminRoles),
  prantController.listPrants
);

router.get(
  "/add",
  requireLogin,
  canManage(adminRoles),
  prantController.getAddForm
);

router.post(
  "/add",
  requireLogin,
  canManage(adminRoles),
  prantController.createPrant
);

router.get(
  "/edit/:id",
  requireLogin,
  canManage(adminRoles),
  prantController.getEditForm
);

router.post(
  "/edit/:id",
  requireLogin,
  canManage(adminRoles),
  prantController.updatePrant
);

router.post(
  "/delete/:id",
  requireLogin,
  canManage(adminRoles),
  prantController.deletePrant
);

module.exports = router;
