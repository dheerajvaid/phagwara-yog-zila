const express = require('express');
const router = express.Router();
const kenderController = require('../controllers/kenderController');
const { requireLogin } = require('../middleware/authMiddleware');
const { canManage } = require('../middleware/roleMiddleware');
const { checkKenderOwnership } = require('../middleware/ownershipMiddleware');

// Routes
router.get('/kender/manage', 
    requireLogin, 
    canManage(['Admin', 'Zila Pradhan', 'Zila Mantri', 'Ksheter Pradhan', 'Ksheter Mantri']),
    kenderController.listKenders
  );

router.get('/kender/add', requireLogin, canManage(['Admin', 'Zila Pradhan', 'Zila Mantri', 'Ksheter Pradhan', 'Ksheter Mantri']), kenderController.showAddForm);
router.post('/kender/add', requireLogin, canManage(['Admin', 'Zila Pradhan', 'Zila Mantri', 'Ksheter Pradhan', 'Ksheter Mantri']), kenderController.createKender);

router.get('/kender/edit/:id', requireLogin, canManage(['Admin', 'Zila Pradhan', 'Zila Mantri', 'Ksheter Pradhan', 'Ksheter Mantri']), checkKenderOwnership, kenderController.showEditForm);
router.post('/kender/edit/:id', requireLogin, canManage(['Admin', 'Zila Pradhan', 'Zila Mantri', 'Ksheter Pradhan', 'Ksheter Mantri']), checkKenderOwnership, kenderController.updateKender);
router.get('/kender/delete/:id', requireLogin, canManage(['Admin', 'Zila Pradhan', 'Zila Mantri', 'Ksheter Pradhan', 'Ksheter Mantri']), kenderController.deleteKender);

router.get('/kender/by-ksheter/:id', requireLogin, kenderController.listByKsheter);

module.exports = router;
