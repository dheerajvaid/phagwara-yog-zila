const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/authMiddleware');
const { canManage } = require('../middleware/roleMiddleware');
const roleController = require('../controllers/roleController');
const { zilaRoles } = require('../config/roles'); // ✅ DRY import

router.get(
  '/roles/manage',
  requireLogin,
  canManage(zilaRoles),
  roleController.showRolePanel
);

router.post(
  '/roles/update/:id',
  requireLogin,
  canManage(zilaRoles),
  roleController.updateRole
);

module.exports = router;
