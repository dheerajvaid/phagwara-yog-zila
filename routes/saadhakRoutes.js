const express = require('express');
const router = express.Router();

const saadhakController = require('../controllers/saadhakController');
const { requireLogin } = require('../middleware/authMiddleware');
const { canManage } = require('../middleware/roleMiddleware');
const { checkSaadhakOwnership } = require('../middleware/ownershipMiddleware');

// Manage all Saadhaks
router.get(
  '/saadhak/manage',
  requireLogin,
  canManage(['Admin', 'Zila Pradhan', 'Zila Mantri', 'Ksheter Pradhan', 'Ksheter Mantri', 'Kender Pramukh', 'Seh Kender Pramukh']),
  saadhakController.listSaadhaks
);

// Add New Saadhak
router.get(
  '/saadhak/add',
  requireLogin,
  canManage(['Admin', 'Zila Pradhan', 'Zila Mantri', 'Ksheter Pradhan', 'Ksheter Mantri', 'Kender Pramukh', 'Seh Kender Pramukh']),
  saadhakController.showAddForm
);

router.post(
  '/saadhak/add',
  requireLogin,
  canManage(['Admin', 'Zila Pradhan', 'Zila Mantri', 'Ksheter Pradhan', 'Ksheter Mantri', 'Kender Pramukh', 'Seh Kender Pramukh']),
  saadhakController.createSaadhak
);

// Edit Saadhak
router.get('/saadhak/edit/:id', requireLogin, canManage(['Admin', 'Zila Pradhan', 'Zila Mantri', 'Ksheter Pradhan', 'Ksheter Mantri', 'Kender Pramukh', 'Seh Kender Pramukh']), checkSaadhakOwnership, saadhakController.showEditForm);
router.post('/saadhak/edit/:id', requireLogin, canManage(['Admin', 'Zila Pradhan', 'Zila Mantri', 'Ksheter Pradhan', 'Ksheter Mantri', 'Kender Pramukh', 'Seh Kender Pramukh']), checkSaadhakOwnership, saadhakController.updateSaadhak);

// Delete Saadhak
router.get('/saadhak/delete/:id', requireLogin, canManage(['Admin', 'Zila Pradhan', 'Zila Mantri', 'Ksheter Pradhan', 'Ksheter Mantri', 'Kender Pramukh', 'Seh Kender Pramukh']), checkSaadhakOwnership, saadhakController.deleteSaadhak);

module.exports = router;
