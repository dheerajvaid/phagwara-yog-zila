const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { requireLogin } = require("../middleware/authMiddleware");

// Routes for login
router.get("/login", authController.showLoginForm);
router.post("/login", authController.checkMobile);

router.get("/create-password", authController.showCreatePasswordForm);
router.post("/create-password", authController.createPassword);

router.get("/login-password", authController.showLoginPasswordForm);
router.post("/login-password", authController.loginWithPassword);

router.get('/change-password', requireLogin, authController.getChangePassword);
router.post('/change-password', requireLogin, authController.changePassword);

router.get("/logout", authController.logout);

module.exports = router;
