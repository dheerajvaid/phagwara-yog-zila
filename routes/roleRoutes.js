const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/authMiddleware');
const { canManage } = require('../middleware/roleMiddleware');
const roleController = require('../controllers/roleController');

router.get('/roles/manage', requireLogin, canManage('Zila Pradhan'), roleController.showRolePanel);
router.post('/roles/update/:id', requireLogin, canManage('Zila Pradhan'), roleController.updateRole);

module.exports = router;
