const express = require("express");
const router = express.Router();
const { showIdCard } = require("../controllers/idCardController");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const saadhakController = require("../controllers/saadhakController");
const { zilaRoles, kenderRoles } = require("../config/roles");

// Specific first
// router.get("/kender/:id", requireLogin, canManage(kenderRoles), saadhakController.downloadKenderIdcards);

// Specific first
router.get("/zila/:id", requireLogin, canManage(zilaRoles), saadhakController.downloadZilaIdcards);

// Dynamic last
router.get("/:id", showIdCard);

module.exports = router;
