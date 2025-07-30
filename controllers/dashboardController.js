// controllers/dashboardController.js
const Zila = require('../models/Zila');
const Ksheter = require('../models/Ksheter');
const Kender = require('../models/Kender');
const Saadhak = require('../models/Saadhak'); // ✅ Saadhak model added

exports.getFrontPageData = async (req, res) => {
  try {
    // Fetch all Zilas under this Prant
    const zilaList = await Zila.find({});

    // Fetch all Ksheter
    const ksheterList = await Ksheter.find({});

    // Fetch all Kenders
    const kenders = await Kender.find({});

    // ✅ Fetch all Saadhaks
    const saadhaks = await Saadhak.find({});

    // Group Ksheter by Zila
    const ksheterByZila = {};
    ksheterList.forEach(ksheter => {
      const zilaId = ksheter.zila?.toString();
      if (!ksheterByZila[zilaId]) ksheterByZila[zilaId] = [];
      ksheterByZila[zilaId].push(ksheter);
    });

    // Group Kenders by Ksheter
    const kendersByKsheter = {};
    kenders.forEach(kender => {
      const ksheterId = kender.ksheter?.toString();
      if (!kendersByKsheter[ksheterId]) kendersByKsheter[ksheterId] = [];
      kendersByKsheter[ksheterId].push(kender);
    });

    // ✅ Group Saadhaks by Kender
    const saadhaksByKender = {};
    saadhaks.forEach(saadhak => {
      const kenderId = saadhak.kender?.toString();
      if (!saadhaksByKender[kenderId]) saadhaksByKender[kenderId] = [];
      saadhaksByKender[kenderId].push(saadhak);
    });

    // ✅ Summary counts
    const totalZilas = zilaList.length;
    const totalKsheter = ksheterList.length;
    const totalKenders = kenders.length;
    const totalSaadhaks = saadhaks.length;

    res.render('home', {
      zilaList,
      ksheterList,
      kendersByKsheter,
      ksheterByZila,
      totalZilas,
      totalKsheter,
      totalKenders,
      totalSaadhaks,
      saadhaksByKender // ✅ Passed for Saadhak count per Kender
    });

  } catch (err) {
    console.error("Error loading Prant dashboard:", err);
    res.status(500).send('Error loading dashboard data');
  }
};
