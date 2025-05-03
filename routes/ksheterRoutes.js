const express = require('express');
const router = express.Router();

const ksheterController = require('../controllers/ksheterController');
const { requireLogin } = require('../middleware/authMiddleware');
const { canManage } = require('../middleware/roleMiddleware');
const { canManageKsheter, checkKsheterOwnership, checkKenderOwnership, checkSaadhakOwnership } = require('../middleware/ownershipMiddleware');


// 🗂️ Manage all Ksheter (Admin + Zila Team)
router.get(
  '/ksheter/manage',
  requireLogin,
  canManage(['Admin', 'Zila Pradhan', 'Zila Mantri']),
  ksheterController.listKsheter
);

// ➕ Add Ksheter
router.get(
  '/ksheter/add',
  requireLogin,
  canManage(['Admin', 'Zila Pradhan', 'Zila Mantri']),
  ksheterController.showAddForm
);

router.post(
  '/ksheter/add',
  requireLogin,
  canManage(['Admin', 'Zila Pradhan', 'Zila Mantri']),
  ksheterController.createKsheter
);

// 🖊️ Edit Ksheter
router.get('/ksheter/edit/:id', requireLogin, canManage(['Admin', 'Zila Pradhan', 'Zila Mantri']), canManageKsheter, ksheterController.showEditForm);
router.post('/ksheter/edit/:id', requireLogin, canManage(['Admin', 'Zila Pradhan', 'Zila Mantri']), canManageKsheter, ksheterController.updateKsheter);


// 🗑️ Delete Ksheter
router.get('/ksheter/delete/:id', requireLogin, canManage(['Admin', 'Zila Pradhan', 'Zila Mantri']), canManageKsheter, ksheterController.deleteKsheter);

module.exports = router;