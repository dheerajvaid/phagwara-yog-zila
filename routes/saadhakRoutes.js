const express = require("express");
const router = express.Router();
const Saadhak = require("../models/Saadhak");
const saadhakController = require("../controllers/saadhakController");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { checkSaadhakOwnership } = require("../middleware/ownershipMiddleware");

// ✅ Role groups from config
const { adminRoles, prantRoles, zilaRoles, ksheterRoles, kenderRoles, kenderTeamRoles, saadhakRoles } = require("../config/roles");

// ✅ Unified allowed roles for Saadhak management
const allowedRoles = [...adminRoles, ...prantRoles, ...zilaRoles, ...ksheterRoles, ...kenderRoles, ...kenderTeamRoles];
const ALL_ROLES = [...adminRoles, ...prantRoles, ...zilaRoles, ...ksheterRoles, ...kenderRoles, ...kenderTeamRoles, ...saadhakRoles];

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

router.get('/saadhak/check-mobile', async (req, res) => {
  try {
    const mobile = req.query.mobile;
    if (!mobile) return res.status(400).json({ error: 'Mobile number is required' });
    
    const saadhak = await Saadhak.findOne({ mobile });
    res.json({ exists: !!saadhak });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// routes/saadhak.js
router.get('/saadhak/self-update', requireLogin, canManage(ALL_ROLES), saadhakController.getSelfUpdateForm);
router.post('/saadhak/self-update', requireLogin, canManage(ALL_ROLES), saadhakController.postSelfUpdate);


module.exports = router;
