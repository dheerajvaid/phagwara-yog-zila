const Zila = require('../models/Zila');
const Ksheter = require('../models/Ksheter');
const Kender = require('../models/Kender');
const Saadhak = require('../models/Saadhak'); // ✅ Add this line

exports.getFrontPageData = async (req, res) => {
  try {
    const zilaList = await Zila.find({});
    const ksheterList = await Ksheter.find({});
    const kenders = await Kender.find({});
    const saadhaks = await Saadhak.find({}); // ✅ Get all saadhaks

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
      totalSaadhaks // ✅ Pass to view
    });
  } catch (err) {
    console.error("Error loading Prant dashboard:", err);
    res.status(500).send('Error loading dashboard data');
  }
};
