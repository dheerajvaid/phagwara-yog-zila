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
    const query = req.query.q?.trim() || "";
    if (!query) return res.redirect("/explore");

    const regex = new RegExp(query, "i");

    // 👤 Only allow specific role types
    const searchableRoles = [
      ...prantRoles,
      ...zilaRoles,
      ...ksheterRoles,
      ...kenderRoles,
    ];

    // 🔍 Search saadhaks
    const matchedSaadhaks = await Saadhak.find({
      role: { $in: searchableRoles }, // ✅ roles (plural) is correct
      $or: [
        { name: regex },
        { mobile: regex },
        { gender: regex },
        { role: regex }, // ✅ match strings in array
      ],
    }).lean();

    
    // 🔍 Direct unit matches
    const [matchedPrants, matchedZilas, matchedKsheters, matchedKenders] =
      await Promise.all([
        Prant.find({ $or: [{ name: regex }, { address: regex }] }).lean(),
        Zila.find({ $or: [{ name: regex }, { address: regex }] }).lean(),
        Ksheter.find({ $or: [{ name: regex }, { address: regex }] }).lean(),
        Kender.find({ $or: [{ name: regex }, { address: regex }] }).lean(),
      ]);

    // 🧠 Collect IDs from both saadhaks & direct units
    const prantIds = [
      ...new Set([
        ...matchedSaadhaks
          .filter((s) => s.role?.some((r) => prantRoles.includes(r)))
          .map((s) => s.prant?.toString())
          .filter(Boolean),
        ...matchedPrants.map((p) => p._id.toString()),
      ]),
    ];

    const zilaIds = [
      ...new Set([
        ...matchedSaadhaks
          .filter((s) => s.role?.some((r) => zilaRoles.includes(r)))
          .map((s) => s.zila?.toString())
          .filter(Boolean),
        ...matchedZilas.map((z) => z._id.toString()),
      ]),
    ];

    const ksheterIds = [
      ...new Set([
        ...matchedSaadhaks
          .filter((s) => s.role?.some((r) => ksheterRoles.includes(r)))
          .map((s) => s.ksheter?.toString())
          .filter(Boolean),
        ...matchedKsheters.map((k) => k._id.toString()),
      ]),
    ];

    const kenderIds = [
      ...new Set([
        ...matchedSaadhaks
          .filter((s) => s.role?.some((r) => kenderRoles.includes(r)))
          .map((s) => s.kender?.toString())
          .filter(Boolean),
        ...matchedKenders.map((k) => k._id.toString()),
      ]),
    ];

    // 📦 Fetch units and all eligible saadhaks for team building
    const [prants, zilas, ksheters, kenders, allSaadhaks] = await Promise.all([
      Prant.find({ _id: { $in: prantIds } })
        .sort({ name: 1 })
        .lean(),
      Zila.find({ _id: { $in: zilaIds } })
        .sort({ name: 1 })
        .lean(),
      Ksheter.find({ _id: { $in: ksheterIds } })
        .sort({ name: 1 })
        .lean(),
      Kender.find({ _id: { $in: kenderIds } })
        .sort({ name: 1 })
        .lean(),
      Saadhak.find({
        role: { $in: searchableRoles },
        $or: [
          { prant: { $in: prantIds } },
          { zila: { $in: zilaIds } },
          { ksheter: { $in: ksheterIds } },
          { kender: { $in: kenderIds } },
        ],
      }).lean(),
    ]);
   
    // 🏢 Enrich Prants with their teams
    const enrichedPrants = await Promise.all(
      prants.map(async (p) => {
        const team = await Saadhak.find({
          prant: p._id,
          role: { $in: [...prantRoles] },
        }).lean();

        team.sort(
          (a, b) =>
            prantRoles.findIndex((role) => a.role.includes(role)) -
            prantRoles.findIndex((role) => b.role.includes(role))
        );

        return {
          ...p,
          team,
        };
      })
    );

    // 🏢 Enrich Zilas with their teams
    const enrichedZilas = await Promise.all(
      zilas.map(async (z) => {
        const team = await Saadhak.find({
          zila: z._id,
          role: { $in: [...zilaRoles] },
        }).lean();

        team.sort(
          (a, b) =>
            zilaRoles.findIndex((role) => a.role.includes(role)) -
            zilaRoles.findIndex((role) => b.role.includes(role))
        );

        return {
          ...z,
          team,
        };
      })
    );

    // 🏢 Enrich Ksheters with their teams
    const enrichedKsheters = await Promise.all(
      ksheters.map(async (k) => {
        const team = await Saadhak.find({
          ksheter: k._id,
          role: { $in: [...ksheterRoles] },
        }).lean();

        team.sort(
          (a, b) =>
            ksheterRoles.findIndex((role) => a.role.includes(role)) -
            ksheterRoles.findIndex((role) => b.role.includes(role))
        );

        return {
          ...k,
          team,
        };
      })
    );

    // 🏢 Enrich Kenders with their teams
    const enrichedKenders = await Promise.all(
      kenders.map(async (k) => {
        const team = await Saadhak.find({
          kender: k._id,
          role: { $in: [...kenderRoles] },
        }).lean();

        team.sort(
          (a, b) =>
            kenderRoles.findIndex((role) => a.role.includes(role)) -
            kenderRoles.findIndex((role) => b.role.includes(role))
        );

        return {
          ...k,
          team,
        };
      })
    );

    // 🖥️ Final render
    res.render("public/searchResults", {
      query,
      results: matchedSaadhaks,
      prants: enrichedPrants, // ✅ added prants
      zilas: enrichedZilas,
      ksheters: enrichedKsheters,
      kenders: enrichedKenders,
      getBadgeColor,
    });
  } catch (err) {
    console.error("🔴 Search error:", err);
    res.status(500).send("Server error during search.");
  }
};
