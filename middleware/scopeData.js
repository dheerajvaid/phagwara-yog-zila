// middleware/scopeData.js
const Prant = require("../models/Prant");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const rolesConfig = require("../config/roles");

async function injectScopeData(req, res, next) {
  try {
    const user = req.session.user;
    const userRoles = user?.roles || [];

    const { adminRoles, prantRoles, zilaRoles, ksheterRoles, kenderRoles, kenderTeamRoles } =
      rolesConfig;

    let prantFilter = {};
    let zilaFilter = {};
    let ksheterFilter = {};
    let kenderFilter = {};

    if (userRoles.some((r) => adminRoles.includes(r))) {
      // Admin → no filters
    } else if (userRoles.some((r) => prantRoles.includes(r))) {
      prantFilter = { _id: user.prant };
      zilaFilter = { prant: user.prant };
      ksheterFilter = { prant: user.prant };
      kenderFilter = { prant: user.prant };
    } else if (userRoles.some((r) => zilaRoles.includes(r))) {
      prantFilter = { _id: user.prant };
      zilaFilter = { _id: user.zila, prant: user.prant };
      ksheterFilter = { zila: user.zila, prant: user.prant };
      kenderFilter = { zila: user.zila, prant: user.prant };
    } else if (userRoles.some((r) => ksheterRoles.includes(r))) {
      prantFilter = { _id: user.prant };
      zilaFilter = { _id: user.zila, prant: user.prant };
      ksheterFilter = { _id: user.ksheter, zila: user.zila, prant: user.prant };
      kenderFilter = {
        ksheter: user.ksheter,
        zila: user.zila,
        prant: user.prant,
      };
    } else if (userRoles.some((r) => kenderRoles.includes(r)) || userRoles.some((r) => kenderTeamRoles.includes(r))) {
      prantFilter = { _id: user.prant };
      zilaFilter = { _id: user.zila, prant: user.prant };
      ksheterFilter = { _id: user.ksheter, zila: user.zila, prant: user.prant };
      kenderFilter = {
        _id: user.kender,
        ksheter: user.ksheter,
        zila: user.zila,
        prant: user.prant,
      };
    }

    res.locals.prantList = await Prant.find(prantFilter)
      .sort({ name: 1 })
      .lean();
    res.locals.zilaList = await Zila.find(zilaFilter).sort({ name: 1 }).lean();
    res.locals.ksheterList = await Ksheter.find(ksheterFilter)
      .sort({ name: 1 })
      .lean();
    res.locals.kenderList = await Kender.find(kenderFilter)
      .sort({ name: 1 })
      .lean();

    res.locals.selectedPrant = user?.prant || "";
    res.locals.selectedZila = user?.zila || "";
    res.locals.selectedKsheter = user?.ksheter || "";
    res.locals.selectedKender = user?.kender || "";

    res.locals.user = user; // required by EJS partial
    next();
  } catch (err) {
    console.error("❌ Failed to inject scope data:", err);
    next(err);
  }
}

module.exports = injectScopeData;
