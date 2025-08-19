const Saadhak = require("../models/Saadhak");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const Attendance = require("../models/Attendance");
const {
  adminRoles,
  prantRoles,
  zilaRoles,
  ksheterRoles,
  kenderRoles,
  kenderTeamRoles,
} = require("../config/roles");

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
  const userRoles = user?.roles || [];
  const dateStr = req.query.date || new Date().toISOString().split("T")[0];
  const date = new Date(dateStr);
  const nextDate = new Date(date);
  nextDate.setDate(date.getDate() + 1);
  const requestData = req

  const slogans = require("../data/slogans.json");
  const randomMessage = slogans[Math.floor(Math.random() * slogans.length)];

  const Attendance = require("../models/Attendance");
  const Kender = require("../models/Kender");

  const prantQuery = normalizeScopeValue(req.query.prant).trim();
  const zilaQuery = normalizeScopeValue(req.query.zila).trim();
  const ksheterQuery = normalizeScopeValue(req.query.ksheter).trim();
  const kenderQuery = normalizeScopeValue(req.query.kender).trim();

  // If no query params, skip validation
  if (Object.keys(req.query).length > 0) {
    // 🛡️ Check if both prant & zila are required
    if (!prantQuery || !zilaQuery) {
      const referer = req.get("Referer");
      const backUrl = referer
        ? referer.split("?")[0]
        : "/report/attendance-filter";

      return res.status(400).render("error/error-page", {
        title: "Invalid Request",
        message: "Both Prant and Zila are required to view attendance.",
        backUrl,
      });
    }
  }

  let attendanceQuery = {
    date: { $gte: date, $lt: nextDate },
    status: "Present",
  };

  const isAdmin = userRoles.some((role) => adminRoles.includes(role));
  const isPrant = userRoles.some((role) => prantRoles.includes(role));
  const isZila = userRoles.some((role) => zilaRoles.includes(role));
  const isKsheter = userRoles.some((role) => ksheterRoles.includes(role));
  const isKender =
    userRoles.some((role) => kenderRoles.includes(role)) ||
    userRoles.some((role) => kenderTeamRoles.includes(role));

  const kenderFilter = {};
  // console.log(isKender);
  // console.log(isAdmin);


  // console.log("Zila Query: " + zilaQuery)
  // Base filter from role
  if (isAdmin) {
    Object.assign(kenderFilter, {
      ...(prantQuery && { prant: prantQuery }),
      ...(zilaQuery && { zila: zilaQuery }),
      ...(ksheterQuery && { ksheter: ksheterQuery }),
      ...(kenderQuery && { _id: kenderQuery }),
    });
  }
  
  if (isPrant) {
    Object.assign(kenderFilter, {
      prant: user.prant,
      ...(zilaQuery && { zila: zilaQuery }),
      ...(ksheterQuery && { ksheter: ksheterQuery }),
      ...(kenderQuery && { _id: kenderQuery }),
    });
  }

  if (isZila) {
    Object.assign(kenderFilter, {
      prant: user.prant,
      zila: user.zila,
      ...(ksheterQuery && { ksheter: ksheterQuery }),
      ...(kenderQuery && { _id: kenderQuery }),
    });
  }

  if (isKsheter) {
    Object.assign(kenderFilter, {
      prant: user.prant,
      zila: user.zila,
      ksheter: user.ksheter,
      ...(kenderQuery && { _id: kenderQuery }),
    });
  }

  if (isKender) {
    Object.assign(kenderFilter, {
      prant: user.prant,
      zila: user.zila,
      ksheter: user.ksheter,
      _id: user.kender, // Always locked for kender role
    });
  }
  // console.log(isKender);
  // console.log(kenderFilter);

  const relevantKenders = await Kender.find(kenderFilter).select("_id");
  console.log(relevantKenders);

  attendanceQuery.kender = { $in: relevantKenders.map((k) => k._id) };

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
  const allKenders = await Kender.find(kenderFilter)
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
    requestData,
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
