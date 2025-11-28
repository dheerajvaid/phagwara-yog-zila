// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middleware/authMiddleware");
const tips = require("../data/tips.json");
const Saadhak = require("../models/Saadhak");
const Paath = require("../paathTracker/models/paath.model"); // <-- add this line
const Kender = require("../models/Kender");

router.get("/dashboard", requireLogin, async (req, res) => {
  try {
    const user = req.session.user;
    const userId = req.session.user.id;
    
    // Fetch full saadhak record
    const userSaadhak = await Saadhak.findById(userId);

    // Random tip
    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    // Calculate BMI
    let bmi = null;
    let bmiCategory = "";

    const heightM =
      (((userSaadhak.heightFeet || 0) * 12 + (userSaadhak.heightInches || 0)) *
        2.54) /
      100;

    if (userSaadhak.weightKg && heightM > 0) {
      bmi = userSaadhak.weightKg / (heightM * heightM);
      bmi = Math.round(bmi * 100) / 100;

      if (bmi < 18.5) bmiCategory = "Underweight";
      else if (bmi < 25) bmiCategory = "Normal";
      else if (bmi < 30) bmiCategory = "Overweight";
      else bmiCategory = "Obese";
    }

    // 🌞 NEW: Fetch today's steps (Paath)
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const paathToday = await Paath.findOne({ user: userId, date: today });
    const todaySteps = paathToday ? paathToday.count : 0;

    // ✅ Send logged-in user's Kender Details (for Tip-of-Day block)
    let kenderDetails = null;

    if (req.session.user && req.session.user.kender) {
      kenderDetails = await Kender.findById(req.session.user.kender).lean();
    }
    // console.log(userId);
    // console.log(kenderDetails);

    // Render page
    res.render("dashboard", {
      user,
      userId,
      userSaadhak,
      tipOfTheDay: randomTip.text,
      bmi,
      bmiCategory,
      todaySteps, // <-- send to EJS
      kenderDetails,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/?error=Unable to load dashboard");
  }
});

module.exports = router;
