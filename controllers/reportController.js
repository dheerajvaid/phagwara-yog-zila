const Saadhak = require("../models/Saadhak");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");

exports.teamSummary = async (req, res) => {
  const user = req.session.user;
  const query = {};

  if (!user.roles.includes("Admin")) {
    if (user.zila) query.zila = user.zila;
    if (user.ksheter) query.ksheter = user.ksheter;
    if (user.kender) query.kender = user.kender;
  }

  const zilas = await Zila.find(query.zila ? { _id: query.zila } : {});
  const ksheters = await Ksheter.find(
    query.ksheter ? { _id: query.ksheter } : {}
  );
  const kenders = await Kender.find(query.kender ? { _id: query.kender } : {});
  const saadhaks = await Saadhak.find(query).populate("zila ksheter kender");

  // Grouping logic
  const summary = {};
  const ksheterTotals = {}; // subtotal for each ksheter
  const zilaTotals = {}; // subtotal for each zila

  saadhaks.forEach((s) => {
    if (!s.zila || !s.ksheter || !s.kender) return;

    const zilaName = s.zila.name;
    const ksheterName = s.ksheter.name;
    const kenderName = s.kender.name;

    summary[zilaName] = summary[zilaName] || {};
    summary[zilaName][ksheterName] = summary[zilaName][ksheterName] || {};
    summary[zilaName][ksheterName][kenderName] = summary[zilaName][ksheterName][
      kenderName
    ] || {
      Saadhak: 0,
      Shikshak: 0,
      Karyakarta: 0,
    };

    ksheterTotals[zilaName] = ksheterTotals[zilaName] || {};
    ksheterTotals[zilaName][ksheterName] = ksheterTotals[zilaName][
      ksheterName
    ] || {
      Saadhak: 0,
      Shikshak: 0,
      Karyakarta: 0,
    };

    zilaTotals[zilaName] = zilaTotals[zilaName] || {
      Saadhak: 0,
      Shikshak: 0,
      Karyakarta: 0,
    };

    s.role.forEach((r) => {
      if (["Saadhak", "Shikshak", "Karyakarta"].includes(r)) {
        summary[zilaName][ksheterName][kenderName][r]++;
        ksheterTotals[zilaName][ksheterName][r]++;
        zilaTotals[zilaName][r]++;
      }
    });
  });
//   console.log(summary);
  res.render("report/summary", {
    summary,
    ksheterTotals,
    zilaTotals,
    user: req.session.user,
  });
};
