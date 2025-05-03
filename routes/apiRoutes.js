const express = require('express');
const router = express.Router();
const Ksheter = require('../models/Ksheter');
const Kender = require('../models/Kender');



// Get Ksheter list based on selected Zila
router.get('/ksheters/:zilaId', async (req, res) => {
  try {
    const ksheterList = await Ksheter.find({ zila: req.params.zilaId }).sort({ name: 1 });
    res.json(ksheterList);
  } catch (err) {
    console.error('Error fetching Ksheter:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

// Get Kender list based on selected Ksheter
router.get('/kenders/:ksheterId', async (req, res) => {
  try {
    const kenderList = await Kender.find({ ksheter: req.params.ksheterId }).sort({ name: 1 });
    res.json(kenderList);
  } catch (err) {
    console.error('Error fetching Kender:', err);
    res.status(500).json({ message: 'Server Error' });
  }
});

module.exports = router;
