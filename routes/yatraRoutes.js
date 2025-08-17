const express = require('express');
const router = express.Router();
const Saadhak = require('../models/Saadhak');
const Yatra = require('../models/Yatra');
const moment = require('moment');

// Root: /vrindavan-trip
router.get('/', (req, res) => {
  res.render('yatra/password');
});

// If someone tries to access /unlock directly via GET, redirect to password page
router.get('/unlock', (req, res) => {
  return res.redirect('/vrindavan-trip');
});


// POST: /vrindavan-trip/unlock
router.post('/unlock', (req, res) => {
  const { password } = req.body;
  if (password === 'krishna') {
    return res.render('yatra/form');
  } else {
    return res.render('yatra/password', { error: 'Incorrect Password' });
  }
});

// POST: /vrindavan-trip/fetch

router.post('/fetch', async (req, res) => {
  const { mobile } = req.body;

  try {
    // 1️⃣ First try to find in Yatra
    const yatraData = await Yatra.findOne({ mobile });

    if (yatraData) {
      const age = moment().diff(moment(yatraData.dob), 'years');

      return res.json({
        success: true,
        yatraData,
        age
      });
    }

    // 2️⃣ If not found in Yatra, try Saadhak
    const saadhak = await Saadhak.findOne({ mobile });

    if (saadhak) {
      const age = moment().diff(moment(saadhak.dob), 'years');

      return res.json({
        success: true,
        saadhak,
        age
      });
    }

    // 3️⃣ Not found in either
    return res.json({ success: false, message: 'Saadhak not found in Yatra or Saadhak DB' });

  } catch (err) {
    console.error(err);
    return res.json({ success: false, message: 'Server error' });
  }
});

// POST: /vrindavan-trip/register
// POST: /vrindavan-trip/register
router.post('/register', async (req, res) => {
  const data = req.body;

  try {
    await Yatra.findOneAndUpdate(
      { mobile: data.mobile },  // filter
      data,                     // data to update
      { upsert: true, new: true } // create if not exists, return new doc
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: 'Error saving registration' });
  }
});

// GET: /vrindavan-trip/success
router.get('/success', (req, res) => {
  res.render('yatra/success');
});

// Catch-all for /vrindavan-trip/*
// router.get('/*', (req, res) => {
//   res.redirect('/vrindavan-trip');
// });

module.exports = router;
