// =================== ROUTE: passwordResetRoutes.js ===================
const express = require('express');
const router = express.Router();
const passwordResetController = require('../controllers/passwordResetController');

// Search and list users
router.get('/reset-password/list', passwordResetController.getAllSaadhaks);

// Reset password
router.post('/reset-password/reset/:id', passwordResetController.resetPassword);

module.exports = router;
