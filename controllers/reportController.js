const Saadhak = require("../models/Saadhak");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const Attendance = require("../models/Attendance");

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

exports.attendanceSummary = async (req, res) => {
  const user = req.session.user;
  const dateStr = req.query.date || new Date().toISOString().split("T")[0]; // default today
  const date = new Date(dateStr);
  const nextDate = new Date(date);
  const slogans = require('../data/slogans.json'); // adjust path as needed
  const randomMessage = slogans[Math.floor(Math.random() * slogans.length)];

  nextDate.setDate(date.getDate() + 1);

  // console.log(user);

  let attendanceQuery = {
    date: { $gte: date, $lt: nextDate },
    status: "Present",
  };

  // Role-based correction: prioritize higher role over stored data
  if (user.roles && user.roles.some((r) => r.includes("Ksheter"))) {
    user.kender = null; // Treat Ksheter-level users as Ksheter, not Kender.
  }
  if (user.roles && user.roles.some((r) => r.includes("Zila"))) {
    user.kender = null;
    user.ksheter = null; // Treat Zila-level users as Zila, ignore lower-level assignments.
  }

  if (user.kender) {
    attendanceQuery.kender = user.kender;
  } else if (user.zila || user.ksheter) {
    const kenderFilter = {};
    if (user.zila) kenderFilter.zila = user.zila;
    if (user.ksheter) kenderFilter.ksheter = user.ksheter;

    const relevantKenders = await Kender.find(kenderFilter).select("_id");
    const kenderIds = relevantKenders.map((k) => k._id);
    attendanceQuery.kender = { $in: kenderIds };
  }

  const attendance = await Attendance.find(attendanceQuery)
    .populate({
      path: "saadhak",
      select: "name",
    })
    .populate({
      path: "kender",
      select: "name ksheter zila",
      populate: [
        { path: "ksheter", model: "Ksheter", select: "name" },
        { path: "zila", model: "Zila", select: "name" },
      ],
    });

  const summary = {};
  const ksheterTotals = {};
  const zilaTotals = {};

  attendance.forEach((a) => {
    const saadhak = a.saadhak;
    const kender = a.kender;

    if (!saadhak || !kender || !kender.zila || !kender.ksheter) return;

    const zilaName = kender.zila.name;
    const ksheterName = kender.ksheter.name;
    const kenderName = kender.name;

    summary[zilaName] = summary[zilaName] || {};
    summary[zilaName][ksheterName] = summary[zilaName][ksheterName] || {};
    summary[zilaName][ksheterName][kenderName] =
      summary[zilaName][ksheterName][kenderName] || 0;
    summary[zilaName][ksheterName][kenderName]++;

    ksheterTotals[zilaName] = ksheterTotals[zilaName] || {};
    ksheterTotals[zilaName][ksheterName] =
      ksheterTotals[zilaName][ksheterName] || 0;
    ksheterTotals[zilaName][ksheterName]++;

    zilaTotals[zilaName] = zilaTotals[zilaName] || 0;
    zilaTotals[zilaName]++;
  });

  const allKenders = await Kender.find(
    user.kender
      ? { _id: user.kender }
      : {
          ...(user.zila ? { zila: user.zila } : {}),
          ...(user.ksheter ? { ksheter: user.ksheter } : {}),
        }
  )
    .populate("zila", "name")
    .populate("ksheter", "name");

  allKenders.forEach((kender) => {
    if (!kender.zila || !kender.ksheter) return;

    const zilaName = kender.zila.name;
    const ksheterName = kender.ksheter.name;
    const kenderName = kender.name;

    summary[zilaName] = summary[zilaName] || {};
    summary[zilaName][ksheterName] = summary[zilaName][ksheterName] || {};

    if (!(kenderName in summary[zilaName][ksheterName])) {
      summary[zilaName][ksheterName][kenderName] = "unmarked";
    }
  });

  // 🆕 SORTING before rendering
  const sortedSummary = {};

  Object.keys(summary)
    .sort()
    .forEach((zilaName) => {
      sortedSummary[zilaName] = {};
      const ksheterNames = Object.keys(summary[zilaName]).sort();

      ksheterNames.forEach((ksheterName) => {
        const kenderEntries = Object.entries(summary[zilaName][ksheterName]);
        const sortedKenderEntries = kenderEntries.sort((a, b) =>
          a[0].localeCompare(b[0])
        );

        sortedSummary[zilaName][ksheterName] = {};
        sortedKenderEntries.forEach(([kenderName, value]) => {
          sortedSummary[zilaName][ksheterName][kenderName] = value;
        });
      });
    });
  
  

  res.render("report/attendanceSummary", {
    summary: sortedSummary, // 👈 Use sorted summary
    ksheterTotals,
    zilaTotals,
    selectedDate: dateStr,
    randomMessage,
    userRole: user.roles[0],
    user,
  });
};
