// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middleware/authMiddleware");
const tips = require('../data/tips.json'); // if using JSON file

router.get("/dashboard", requireLogin, (req, res) => {
  const user = req.session.user;

  // Pick random tip
  const randomTip = tips[Math.floor(Math.random() * tips.length)];

  
  res.render("dashboard", {
    user,
    tipOfTheDay: randomTip.text,
  });
});

module.exports = router;
