// controllers/dashboardController.js
const Prant = require("../models/Prant");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const Saadhak = require("../models/Saadhak");

exports.getFrontPageData = async (req, res) => {
  try {
    // ✅ Fetch all sorted data
    const prantList = await Prant.find({}).sort({ name: 1 });
    const zilaList = await Zila.find({}).sort({ name: 1 });
    const ksheterList = await Ksheter.find({}).sort({ name: 1 });
    const kenders = await Kender.find({}).sort({ name: 1 });
    const saadhaks = await Saadhak.find({}).sort({ name: 1 });

    // ✅ Grouping mappings
    const zilaByPrant = {};
    zilaList.forEach((zila) => {
      const id = zila.prant?.toString();
      if (!zilaByPrant[id]) zilaByPrant[id] = [];
      zilaByPrant[id].push(zila);
    });

    const ksheterByZila = {};
    ksheterList.forEach((ksheter) => {
      const id = ksheter.zila?.toString();
      if (!ksheterByZila[id]) ksheterByZila[id] = [];
      ksheterByZila[id].push(ksheter);
    });

    const kendersByKsheter = {};
    kenders.forEach((kender) => {
      const id = kender.ksheter?.toString();
      if (!kendersByKsheter[id]) kendersByKsheter[id] = [];
      kendersByKsheter[id].push(kender);
    });

    const saadhaksByKender = {};
    saadhaks.forEach((s) => {
      const id = s.kender?.toString();
      if (!saadhaksByKender[id]) saadhaksByKender[id] = [];
      saadhaksByKender[id].push(s);
    });

    // ✅ Additional groupings for counts to work properly
    const saadhaksByKsheter = {};
    ksheterList.forEach((ksheter) => {
      const id = ksheter._id.toString();
      saadhaksByKsheter[id] = saadhaks.filter(
        (s) =>
          s.ksheter?.toString() === id ||
          (s.kender && (kendersByKsheter[id] || []).some((k) => k._id.toString() === s.kender.toString()))
      );
    });

    const saadhaksByZila = {};
    zilaList.forEach((zila) => {
      const id = zila._id.toString();
      const ksheterUnder = ksheterByZila[id] || [];
      const ksheterIds = ksheterUnder.map((k) => k._id.toString());
      const kenderIds = ksheterUnder.flatMap(
        (ks) => (kendersByKsheter[ks._id] || []).map((k) => k._id.toString())
      );

      saadhaksByZila[id] = saadhaks.filter(
        (s) =>
          s.zila?.toString() === id ||
          ksheterIds.includes(s.ksheter?.toString()) ||
          kenderIds.includes(s.kender?.toString())
      );
    });

    const saadhaksByPrant = {};
    prantList.forEach((prant) => {
      const id = prant._id.toString();
      const zilaUnder = zilaByPrant[id] || [];
      const zilaIds = zilaUnder.map((z) => z._id.toString());
      const ksheterIds = zilaUnder.flatMap(
        (z) => (ksheterByZila[z._id] || []).map((ks) => ks._id.toString())
      );
      const kenderIds = ksheterIds.flatMap(
        (ksId) => (kendersByKsheter[ksId] || []).map((k) => k._id.toString())
      );

      saadhaksByPrant[id] = saadhaks.filter(
        (s) =>
          s.prant?.toString() === id ||
          zilaIds.includes(s.zila?.toString()) ||
          ksheterIds.includes(s.ksheter?.toString()) ||
          kenderIds.includes(s.kender?.toString())
      );
    });

    // ✅ Hierarchical counts (for quick access if needed)
    const counts = { prant: {}, zila: {}, ksheter: {}, kender: {} };

    kenders.forEach((kender) => {
      const id = kender._id.toString();
      counts.kender[id] = saadhaksByKender[id]?.length || 0;
    });

    ksheterList.forEach((ksheter) => {
      const id = ksheter._id.toString();
      counts.ksheter[id] = saadhaksByKsheter[id]?.length || 0;
    });

    zilaList.forEach((zila) => {
      const id = zila._id.toString();
      counts.zila[id] = saadhaksByZila[id]?.length || 0;
    });

    prantList.forEach((prant) => {
      const id = prant._id.toString();
      counts.prant[id] = saadhaksByPrant[id]?.length || 0;
    });
    

    // ✅ Render final output
    res.render("home", {
      prantList,
      zilaByPrant,
      zilaList,
      ksheterList,
      ksheterByZila,
      kendersByKsheter,
      saadhaksByKender,
      saadhaksByKsheter,
      saadhaksByZila,
      saadhaksByPrant,
      counts,
      totalPrants: prantList.length,
      totalZilas: zilaList.length,
      totalKsheter: ksheterList.length,
      totalKenders: kenders.length,
      totalSaadhaks: saadhaks.length,      
    });
  } catch (err) {
    console.error("Error loading dashboard:", err);
    res.status(500).send("Error loading data");
  }
};
