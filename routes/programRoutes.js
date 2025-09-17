const express = require("express");
const router = express.Router();
const programController = require("../controllers/programController");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const {
  prantRoles,
  zilaRoles,
  ksheterRoles,
  kenderRoles,
  kenderTeamRoles,
  saadhakRoles,
} = require("../config/roles");
const { create } = require("connect-mongo");

CREATE_ROLES = [...prantRoles, ...zilaRoles, ...ksheterRoles, ...kenderRoles];
ALL_ROLES = [...CREATE_ROLES, ...kenderTeamRoles, ...saadhakRoles];

router.get(
  "/",
  requireLogin,
  canManage(CREATE_ROLES),
  programController.listPrograms
);

// Single program detail (public or logged-in)
// router.get('/:id', requireLogin, programController.viewProgram);

// -----------------------
// Admin-only views
// -----------------------
router.get(
  "/create",
  requireLogin,
  canManage(CREATE_ROLES),
  programController.showCreateForm
);
router.post(
  "/create",
  requireLogin,
  canManage(CREATE_ROLES),
  programController.createProgram
);

router.get(
  "/edit/:id",
  requireLogin,
  canManage(CREATE_ROLES),
  programController.showEditForm
);
router.post(
  "/edit/:id",
  requireLogin,
  canManage(CREATE_ROLES),
  programController.updateProgram
);

// Delete program
router.post(
  "/delete/:id",
  requireLogin,
  canManage(CREATE_ROLES),
  programController.deleteProgram
);

router.get(
  "/:id/export",
  requireLogin,
  canManage(ALL_ROLES),
  programController.exportProgramDetail
);

router.get(
  "/available",
  requireLogin,
  canManage(ALL_ROLES),
  programController.listAvailablePrograms
);

router.post(
  "/:id/register",
  requireLogin,
  canManage(ALL_ROLES),
  programController.registerProgram
);
router.post(
  "/:id/deregister",
  requireLogin,
  canManage(ALL_ROLES),
  programController.deregisterProgram
);

router.get('/:id/registrations', programController.getRegisteredUsers);
router.get('/:id/registrations/export', programController.exportRegistrationsToExcel);

module.exports = router;
