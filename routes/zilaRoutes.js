const express = require('express');
const router = express.Router();
const zilaController = require('../controllers/zilaController');
const { requireLogin } = require('../middleware/authMiddleware');
const { canManage } = require('../middleware/roleMiddleware');

router.get('/zila/manage', requireLogin, canManage('Zila Pradhan'), zilaController.listZilas);

// Only Admin can add/edit/delete Zila
router.get('/zila/add', requireLogin, canManage('Admin'), zilaController.showAddForm);
router.post('/zila/add', requireLogin, canManage('Admin'), zilaController.createZila);

router.get('/zila/edit/:id', requireLogin, canManage('Admin'), zilaController.showEditForm);
router.post('/zila/edit/:id', requireLogin, canManage('Admin'), zilaController.updateZila);

router.get('/zila/delete/:id', requireLogin, canManage('Admin'), zilaController.deleteZila);

module.exports = router;