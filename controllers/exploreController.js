// controllers/exploreController.js
const Prant = require("../models/Prant");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const Saadhak = require("../models/Saadhak");
const {
  prantRoles,
  zilaRoles,
  ksheterRoles,
  kenderRoles,
  kenderTeamRoles,
} = require("../config/roles");

const getBadgeColor = require("../partials/badgeHelper");

exports.showExploreHome = async (req, res) => {
  try {
    const prants = await Prant.find().lean();
    const zilas = await Zila.find().lean();
    const ksheters = await Ksheter.find().lean();
    const saadhaks = await Saadhak.find().lean();
    const kenders = await Kender.find().lean();

    // 🔹 Enrich Prant with team
    const enrichedPrants = prants.map((prant) => {
      const team = saadhaks.filter(
        (s) =>
          s.prant?.toString() === prant._id.toString() &&
          Array.isArray(s.role) &&
          s.role.some((r) => prantRoles.includes(r))
      );

      return {
        ...prant,
        team,
      };
    });

    // 🔹 Enrich Zila with team
    const enrichedZilas = zilas.map((zila) => {
      const team = saadhaks.filter(
        (s) =>
          s.zila?.toString() === zila._id.toString() &&
          Array.isArray(s.role) &&
          s.role.some((r) => zilaRoles.includes(r))
      );

      return {
        ...zila,
        team,
      };
    });

    // 🔹 Enrich Ksheter with team
    const enrichedKsheters = ksheters.map((ksheter) => {
      const team = saadhaks.filter(
        (s) =>
          s.ksheter?.toString() === ksheter._id.toString() &&
          Array.isArray(s.role) &&
          s.role.some((r) => ksheterRoles.includes(r))
      );

      return {
        ...ksheter,
        team,
      };
    });

    // 🔹 Enrich Kenders with team (already working logic)
    const enrichedKenders = kenders.map((kender) => {
      const team = saadhaks.filter(
        (s) =>
          s.kender?.toString() === kender._id.toString() &&
          Array.isArray(s.role) &&
          s.role.some((r) => kenderRoles.includes(r))
      );

      return {
        ...kender,
        team,
      };
    });

    // 🧾 Optional: log for verification
    // console.dir(enrichedPrants, { depth: null });
    // console.dir(enrichedZilas, { depth: null });
    // console.dir(enrichedKsheters, { depth: null });
    // console.dir(enrichedKenders, { depth: null });

    // 🧠 Render with all enriched data
    res.render("public/explore", {
      prants: enrichedPrants,
      zilas: enrichedZilas,
      ksheters: enrichedKsheters,
      kenders: enrichedKenders,
      saadhaks, // raw list if still needed
      prantRoles,
      zilaRoles,
      ksheterRoles,
      kenderRoles,
      getBadgeColor,
    });
  } catch (err) {
    console.error("Error in showExploreHome:", err);
    res.status(500).send("Server error");
  }
};


// 🏢 Zila Detail Page
exports.showZilaDetail = async (req, res) => {
  try {
    const zilaId = req.params.zilaId;
    const zila = await Zila.findById(zilaId).lean();

    const ksheterList = await Ksheter.find({ zila: zilaId }).lean();
    const saadhaks = await Saadhak.find({ zila: zilaId }).lean();

    res.render("public/zilaDetail", {
      zila,
      ksheterList,
      saadhaks,
      zilaRoles,
      ksheterRoles,
    });
  } catch (err) {
    console.error("❌ Error in showZilaDetail:", err);
    res.status(500).send("Error loading Zila detail");
  }
};

// 🏠 Ksheter Detail Page
exports.showKsheterDetail = async (req, res) => {
  try {
    const ksheterId = req.params.ksheterId;
    const ksheter = await Ksheter.findById(ksheterId).lean();

    const kenders = await Kender.find({ ksheter: ksheterId }).lean();
    const saadhaks = await Saadhak.find({ ksheter: ksheterId }).lean();

    res.render("public/ksheterDetail", {
      ksheter,
      kenders,
      saadhaks,
      ksheterRoles,
      kenderRoles,
    });
  } catch (err) {
    console.error("❌ Error in showKsheterDetail:", err);
    res.status(500).send("Error loading Ksheter detail");
  }
};

// 🧘‍♂️ Kender Detail Page
exports.showKenderDetail = async (req, res) => {
  try {
    const kenderId = req.params.kenderId;
    const kender = await Kender.findById(kenderId).lean();

    const saadhaks = await Saadhak.find({ kender: kenderId }).lean();

    res.render("public/kenderDetail", {
      kender,
      saadhaks,
      kenderRoles,
      kenderTeamRoles,
    });
  } catch (err) {
    console.error("❌ Error in showKenderDetail:", err);
    res.status(500).send("Error loading Kender detail");
  }
};


exports.handleSearchQuery = async (req, res) => {
  try {
    const query = req.query.q?.trim();
    if (!query) return res.redirect("/explore");

    const regex = new RegExp(query, "i");

    // Fetch all saadhaks first (needed for team enrichment)
    const allSaadhaks = await Saadhak.find()
      .populate("prant zila ksheter kender") // for name-based filtering
      .lean();

    // 📍 Filter saadhaks by query (name, mobile, address, role, OR associated location names)
    const saadhaks = allSaadhaks.filter((s) =>
      regex.test(s.name || "") ||
      regex.test(s.mobile || "") ||
      regex.test(s.address || "") ||
      s.roles?.some((r) => regex.test(r)) ||
      regex.test(s?.prant?.name || "") ||
      regex.test(s?.zila?.name || "") ||
      regex.test(s?.ksheter?.name || "") ||
      regex.test(s?.kender?.name || "")
    );

    // 🏢 Prants
    const prantsRaw = await Prant.find({ name: regex }).lean();
    const enrichedPrants = prantsRaw.map((prant) => {
      const team = allSaadhaks.filter(
        (s) =>
          s.prant?._id?.toString() === prant._id.toString() &&
          s.roles?.some((r) => prantRoles.includes(r))
      );
      return { ...prant, team };
    });

    // 🏙️ Zilas
    const zilasRaw = await Zila.find({ name: regex }).lean();
    const enrichedZilas = zilasRaw.map((zila) => {
      const team = allSaadhaks.filter(
        (s) =>
          s.zila?._id?.toString() === zila._id.toString() &&
          s.roles?.some((r) => zilaRoles.includes(r))
      );
      return { ...zila, team };
    });

    // 🏞️ Ksheters
    const kshetersRaw = await Ksheter.find({ name: regex }).lean();
    const enrichedKsheters = kshetersRaw.map((ksheter) => {
      const team = allSaadhaks.filter(
        (s) =>
          s.ksheter?._id?.toString() === ksheter._id.toString() &&
          s.roles?.some((r) => ksheterRoles.includes(r))
      );
      return { ...ksheter, team };
    });

    // 🧘‍♂️ Kenders
    const kendersRaw = await Kender.find({
      $or: [{ name: regex }, { address: regex }],
    }).lean();
    const enrichedKenders = kendersRaw.map((kender) => {
      const team = allSaadhaks.filter(
        (s) =>
          s.kender?._id?.toString() === kender._id.toString() &&
          s.roles?.some((r) => kenderRoles.includes(r))
      );
      return { ...kender, team };
    });

    // 🎯 Send to EJS
    res.render("public/searchResults", {
      query,
      prants: enrichedPrants,
      zilas: enrichedZilas,
      ksheters: enrichedKsheters,
      kenders: enrichedKenders,
      saadhaks,
      getBadgeColor,
    });
  } catch (err) {
    console.error("❌ Error in handleSearchQuery:", err);
    res.status(500).send("Error processing search");
  }
};
