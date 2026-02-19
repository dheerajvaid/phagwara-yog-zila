const express = require('express');
const router = express.Router();
const { requireLogin } = require('../middleware/authMiddleware');
const { canManage } = require('../middleware/roleMiddleware');
const { adminRoles } = require('../config/roles'); // ✅ Import from config
const AllowedDays = require("../models/AllowedDays");

// ✅ Admin Panel Route
router.get('/admin/panel', requireLogin, canManage(adminRoles), (req, res) => {
  res.render('admin/panel', { user: req.session.user });
});

router.get('/admin/alloweddays', requireLogin, canManage(adminRoles), async (req, res) => {
  try {
    const doc = await AllowedDays.findOne();
    
    res.render('admin/alloweddays', { 
      user: req.session.user,
      // Pass the number, default to 0 if doc is null
      daysValue: doc ? doc.days : 3 
    });
  } catch (err) {
    res.status(500).send("Database Error");
  }
});


router.post('/admin/alloweddays', requireLogin, canManage(adminRoles), async (req, res) => {
  try {
    const newNumber = req.body.days;

    await AllowedDays.findOneAndUpdate(
      {}, // Find any existing doc
      { days: newNumber }, 
      { 
        upsert: true, // This adds the record if it is null
        new: true, 
        setDefaultsOnInsert: true 
      }
    );

    res.redirect('/admin/alloweddays');
  } catch (err) {
    res.status(500).send("Update Failed");
  }
});


module.exports = router;
