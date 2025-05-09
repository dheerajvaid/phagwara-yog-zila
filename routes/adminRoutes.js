const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/authMiddleware');
const { canManage } = require('../middleware/roleMiddleware');
const { adminOnly } = require('../config/roles'); // ✅ Import from config

// ✅ Admin Panel Route
router.get('/admin/panel', requireLogin, canManage(adminOnly), (req, res) => {
  res.render('admin/panel', { user: req.session.user });
});

module.exports = router;
