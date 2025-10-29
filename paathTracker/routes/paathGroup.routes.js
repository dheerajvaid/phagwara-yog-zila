const express = require("express");
const router = express.Router();
const groupPaathController = require("../controllers/paathGroup.controller");
const { requireLogin } = require("../../middleware/authMiddleware");

router.get("/group", requireLogin, groupPaathController.getGroupPaath);
router.get("/ajax/get-group", requireLogin, groupPaathController.getGroupPaathByDate);
router.post("/ajax/save-group", requireLogin, groupPaathController.saveGroupPaath);

module.exports = router;
