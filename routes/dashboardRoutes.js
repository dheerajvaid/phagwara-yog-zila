// routes/dashboardRoutes.js
const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/authMiddleware');

router.get('/dashboard', requireLogin, (req, res) => {
  res.render('dashboard', { user: req.session.user });
});

module.exports = router;
