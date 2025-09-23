// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middleware/authMiddleware");
const tips = require('../data/tips.json'); // if using JSON file
const Saadhak = require("../models/Saadhak");

router.get("/dashboard", requireLogin, async (req, res) => {
  try {
    const user = req.session.user;
    const userId = req.session.user.id;

    // Fetch full saadhak record from DB
    const userSaadhak = await Saadhak.findById(userId);

    // Pick random tip
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    // Calculate BMI
    let bmi = null;
    let bmiCategory = '';
    const heightM = ((userSaadhak.heightFeet || 0) * 12 + (userSaadhak.heightInches || 0)) * 2.54 / 100;
    if (userSaadhak.weightKg && heightM > 0) {
      bmi = userSaadhak.weightKg / (heightM * heightM);
      bmi = Math.round(bmi * 100) / 100;

      if (bmi < 18.5) bmiCategory = 'Underweight';
      else if (bmi < 25) bmiCategory = 'Normal';
      else if (bmi < 30) bmiCategory = 'Overweight';
      else bmiCategory = 'Obese';
    }

    res.render("dashboard", {
      user,
      userSaadhak,
      tipOfTheDay: randomTip.text,
      bmi,
      bmiCategory
    });

  } catch (err) {
    console.error(err);
    res.redirect("/?error=Unable to load dashboard");
  }
});

module.exports = router;
