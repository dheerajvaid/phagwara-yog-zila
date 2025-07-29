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

const normalizeScopeValue = (value) => {
  if (!value) return "";
  if (Array.isArray(value)) return value[0] || "";
  return String(value);
};

exports.attendanceSummary = async (req, res) => {
  const user = req.session.user;
  const dateStr = req.query.date || new Date().toISOString().split("T")[0];
  const date = new Date(dateStr);
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + 1);

  const slogans = require("../data/slogans.json");
  const randomMessage = slogans[Math.floor(Math.random() * slogans.length)];

  const Attendance = require("../models/Attendance");
  const Kender = require("../models/Kender");

  const zilaParam = normalizeScopeValue(req.query.zila).trim();
  const ksheterParam = normalizeScopeValue(req.query.ksheter).trim();
  const kenderParam = normalizeScopeValue(req.query.kender).trim();

  let attendanceQuery = {
    date: { $gte: date, $lt: nextDate },
    status: "Present",
  };

  // User-specified filter logic (has higher priority)
  if (kenderParam) {
    attendanceQuery.kender = kenderParam;
  } else if (ksheterParam || zilaParam) {
    const kenderFilter = {};
    if (zilaParam) kenderFilter.zila = zilaParam;
    if (ksheterParam) kenderFilter.ksheter = ksheterParam;

    const relevantKenders = await Kender.find(kenderFilter).select("_id");
    attendanceQuery.kender = { $in: relevantKenders.map((k) => k._id) };
  } else {
    // Role-based fallback (if no dropdown filter was selected)
    if (user.kender) {
      attendanceQuery.kender = user.kender;
    } else if (user.zila || user.ksheter) {
      const kenderFilter = {};
      if (user.zila) kenderFilter.zila = user.zila;
      if (user.ksheter) kenderFilter.ksheter = user.ksheter;

      const relevantKenders = await Kender.find(kenderFilter).select("_id");
      attendanceQuery.kender = { $in: relevantKenders.map((k) => k._id) };
    }
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

  // Include all kendras to show "unmarked"
  const allKenders = await Kender.find(
    kenderParam
      ? { _id: kenderParam }
      : ksheterParam
        ? { ksheter: ksheterParam }
        : zilaParam
          ? { zila: zilaParam }
          : user.kender
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

  // Sort final summary
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
    summary: sortedSummary,
    ksheterTotals,
    zilaTotals,
    selectedDate: dateStr,
    randomMessage,
    userRole: user.roles[0],
    user,
  });
};


exports.attendanceFilterPage = async (req, res) => {
  try {
    const user = req.session.user;

    let zilas = [];

    if (user.roles.includes("Admin")) {
      // Admin can view all Zilas
      zilas = await Zila.find().sort({ name: 1 });
    } else {
      // Others can only see their associated Zila
      zilas = await Zila.find({ _id: user.zila });
    }

    res.render("report/attendanceFilter", {
      user,
      zilas, // Will be 1 zila or all based on role
    });

  } catch (err) {
    console.error("Error loading attendance filter form:", err);
    res.status(500).send("Server Error");
  }
};

