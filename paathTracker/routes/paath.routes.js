const express = require("express");
const router = express.Router();
const paathController = require("../controllers/paath.controller");
const { requireLogin } = require("../../middleware/authMiddleware");

// 🌸 Show Paath Entry Page
router.get("/add", requireLogin, paathController.getAddPaath);

// 🌸 AJAX Routes
router.get("/ajax/get", requireLogin, paathController.getPaathByDate);  // fetch paath count for date
router.post("/ajax/save", requireLogin, paathController.savePaath);     // save/update/delete paath entry

// 🌸 User's 30-day History
router.get("/list", requireLogin, paathController.getPaathList);

// 🌸 Daily Group Summary (all users)
router.get("/summary", requireLogin, paathController.getPaathSummary);

module.exports = router;
