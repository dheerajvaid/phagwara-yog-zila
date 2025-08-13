const express = require('express');
const router = express.Router();
const programController = require('../controllers/programController');
const registrationController = require('../controllers/registrationController');
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const {
  prantRoles,
  zilaRoles,
  ksheterRoles,
  kenderRoles,
  kenderTeamRoles,
} = require("../config/roles");

// -----------------------
// Public views
// -----------------------

// List all programs (main page)
router.get('/', requireLogin, programController.listPrograms);

// Single program detail (public or logged-in)
// router.get('/:id', requireLogin, programController.viewProgram);

// -----------------------
// Admin-only views
// -----------------------
router.get('/create', requireLogin, programController.showCreateForm);
router.post('/create', requireLogin, programController.createProgram);

router.get('/edit/:id', requireLogin, programController.showEditForm);
router.post('/edit/:id', requireLogin, programController.updateProgram);

// Delete program
router.post('/delete/:id', requireLogin, programController.deleteProgram);


router.get('/:id/export', programController.exportProgramDetail);


router.get("/available", programController.listAvailablePrograms);

router.post("/:id/register", programController.registerProgram);
router.post("/:id/deregister", programController.deregisterProgram);

module.exports = router;
