const express = require('express');
const router = express.Router();
const zilaController = require('../controllers/zilaController');
const { requireLogin } = require('../middleware/authMiddleware');
const { canManage } = require('../middleware/roleMiddleware');
const { zilaRoles, adminOnly } = require('../config/roles'); // ✅ DRY import

// Manage Zilas (Zila-level access)
router.get(
  '/zila/manage',
  requireLogin,
  canManage(zilaRoles),
  zilaController.listZilas
);

// Add Zila (Admin only)
router.get(
  '/zila/add',
  requireLogin,
  canManage(adminOnly),
  zilaController.showAddForm
);
router.post(
  '/zila/add',
  requireLogin,
  canManage(adminOnly),
  zilaController.createZila
);

// Edit Zila (Admin only)
router.get(
  '/zila/edit/:id',
  requireLogin,
  canManage(adminOnly),
  zilaController.showEditForm
);
router.post(
  '/zila/edit/:id',
  requireLogin,
  canManage(adminOnly),
  zilaController.updateZila
);

// Delete Zila (Admin only)
router.get(
  '/zila/delete/:id',
  requireLogin,
  canManage(adminOnly),
  zilaController.deleteZila
);

module.exports = router;
