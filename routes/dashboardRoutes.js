// routes/dashboardRoutes.js
const express = require("express");
const router = express.Router();
const { requireLogin } = require("../middleware/authMiddleware");
const refreshSessionPhoto = require("../middleware/refreshSessionPhoto");
const tips = require("../data/tips.json");
const Saadhak = require("../models/Saadhak");
const Paath = require("../paathTracker/models/paath.model");
const Kender = require("../models/Kender");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Prant = require("../models/Prant");

router.get(
  "/dashboard",
  requireLogin,
  refreshSessionPhoto,
  async (req, res) => {
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
        (((userSaadhak.heightFeet || 0) * 12 +
          (userSaadhak.heightInches || 0)) *
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

      // 🌞 Today's Steps
      const today = new Date().toISOString().slice(0, 10);
      const paathToday = await Paath.findOne({
        user: userId,
        date: today,
      });

      const todaySteps = paathToday ? paathToday.count : 0;

      // Logged-in user's hierarchy details
      let kenderDetails = null;
      let ksheterDetails = null;
      let zilaDetails = null;
      let prantDetails = null;

      if (req.session.user && req.session.user.kender) {
        kenderDetails = await Kender.findById(req.session.user.kender).lean();
      }

      if (req.session.user && req.session.user.ksheter) {
        ksheterDetails = await Ksheter.findById(
          req.session.user.ksheter,
        ).lean();
      }

      if (req.session.user && req.session.user.zila) {
        zilaDetails = await Zila.findById(req.session.user.zila).lean();
      }

      if (req.session.user && req.session.user.prant) {
        prantDetails = await Prant.findById(req.session.user.prant).lean();
      }

      // ---------- Display Role ----------
      let displayRole = user.roles?.[0] || "Saadhak";

      if (displayRole.includes("Prant") && prantDetails) {
        displayRole += `<br><span class="small">${prantDetails.name}</span>`;
      } else if (displayRole.includes("Zila") && zilaDetails) {
        displayRole += `<br><span class="small">${zilaDetails.name}</span>`;
      } else if (displayRole.includes("Ksheter") && ksheterDetails) {
        displayRole += `<br><span class="small">${ksheterDetails.name}</span>`;
      }
      // Kender roles remain unchanged
      // Render page
      res.render("dashboard", {
        user,
        userId,
        userSaadhak,
        tipOfTheDay: randomTip.text,
        bmi,
        bmiCategory,
        todaySteps,
        kenderDetails,
        ksheterDetails,
        zilaDetails,
        prantDetails,
        displayRole,
      });
    } catch (err) {
      console.error(err);
      res.redirect("/?error=Unable to load dashboard");
    }
  },
);

module.exports = router;
