const express = require('express');
const router = express.Router();
const zilaController = require('../controllers/zilaController');
const { requireLogin } = require('../middleware/authMiddleware');
const { canManage } = require('../middleware/roleMiddleware');
const { adminRoles, prantRoles, zilaRoles } = require('../config/roles'); // ✅ DRY import
const allowedRoles = [...adminRoles, ...prantRoles];
// Manage Zilas (Zila-level access)
router.get(
  '/zila/manage',
  requireLogin,
  canManage([...allowedRoles, ...zilaRoles]),
  zilaController.listZilas
);

// Add Zila (Admin only)
router.get(
  '/zila/add',
  requireLogin,
  canManage(allowedRoles),
  zilaController.showAddForm
);
router.post(
  '/zila/add',
  requireLogin,
  canManage(allowedRoles),
  zilaController.createZila
);

// Edit Zila (Admin only)
router.get(
  '/zila/edit/:id',
  requireLogin,
  canManage(allowedRoles),
  zilaController.showEditForm
);
router.post(
  '/zila/edit/:id',
  requireLogin,
  canManage(allowedRoles),
  zilaController.updateZila
);

// Delete Zila (Admin only)
router.get(
  '/zila/delete/:id',
  requireLogin,
  canManage(allowedRoles),
  zilaController.deleteZila
);

module.exports = router;
