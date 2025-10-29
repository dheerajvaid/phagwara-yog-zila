const Paath = require("../models/paath.model");
const Saadhak = require("../../models/Saadhak.js");

// 🌸 GET: Paath Entry Page
exports.getAddPaath = async (req, res) => {
  try {
    const user = req.session.user;
    const userId = user.id;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const existingPaath = await Paath.findOne({ user: userId, date: today });

    res.render("paath-add", {
      user: user,
      date: today,
      count: existingPaath ? existingPaath.count : "",
    });
  } catch (err) {
    console.error("Error loading paath page:", err);
    res.status(500).send("Error loading paath entry page");
  }
};

// 🌸 POST (AJAX or normal): Save or update Paath count
exports.savePaath = async (req, res) => {
  try {
    const user = req.session.user;

    const userId = user.id;
    const { date, count } = req.body;
    const n = Number(count);

    if (!date) return res.status(400).json({ error: "Date is required" });

    if (n === 0) {
      await Paath.findOneAndDelete({ user: userId, date });
      return res.json({ message: "Deleted", count: 0 });
    }

    const saved = await Paath.findOneAndUpdate(
      { user: userId, date },
      { user: userId, date, count: n },
      { upsert: true, new: true }
    );

    res.json({ message: "Saved", count: saved.count });
  } catch (err) {
    console.error("Error saving paath:", err);
    res.status(500).json({ error: "Error saving paath count" });
  }
};

// 🌸 AJAX: Get existing count for any date
exports.getPaathByDate = async (req, res) => {
  try {
    const user = req.session.user;
    const userId = user.id;
    const { date } = req.query;
    const paath = await Paath.findOne({ user: userId, date });
    res.json({ count: paath ? paath.count : 0 });
  } catch (err) {
    console.error("Error fetching paath:", err);
    res.status(500).json({ error: "Error fetching paath data" });
  }
};

exports.getPaathList = async (req, res) => {
  try {
    const user = req.session.user;
    const userId = user.id;

    // Fetch only the latest 30 entries for display
    const paaths = await Paath.find({ user: userId })
      .sort({ date: -1 })
      .limit(30);

    // Fetch all paaths for total calculation (only _id and paathCount to make it lighter)
    const allPaaths = await Paath.find({ user: userId }).select("count");

    // 🧮 Calculate total paaths from all records
    const totalPaath = allPaaths.reduce((sum, p) => sum + (p.count || 0), 0);

    res.render("paath-list", {
      user: user,
      paaths,
      totalPaath,
    });
  } catch (err) {
    console.error("Error loading paath list:", err);
    res.status(500).send("Error loading paath history");
  }
};


// 🌸 GET: Group summary (total & all members for a given date)
exports.getPaathSummary = async (req, res) => {
  try {
    const user = req.session.user;
    const selectedDate = req.query.date || new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    // 🌞 Total paath count for selected date
    const groupTotal = await Paath.aggregate([
      { $match: { date: selectedDate } },
      { $group: { _id: null, total: { $sum: "$count" } } },
    ]);

    const totalToday = groupTotal[0]?.total || 0;

    // 👥 All members who did paath on that date
    const topMembers = await Paath.aggregate([
      { $match: { date: selectedDate } },
      { $group: { _id: "$user", total: { $sum: "$count" } } },
      { $sort: { total: -1 } },
      {
        $lookup: {
          from: "saadhaks",
          localField: "_id",
          foreignField: "_id",
          as: "saadhak",
        },
      },
    ]);

    // 🪄 If AJAX request (fetch only data)
    if (req.xhr) {
      return res.json({ totalToday, topMembers });
    }

    // Otherwise render full page
    res.render("paath-summary", {
      user,
      totalToday,
      topMembers,
      selectedDate,
    });
  } catch (err) {
    console.error("Error loading paath summary:", err);
    res.status(500).send("Error loading paath summary");
  }
};

