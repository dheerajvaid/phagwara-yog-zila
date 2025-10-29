const Paath = require("../models/paath.model");
const Saadhak = require("../../models/Saadhak");

// 🌸 GET: Group Paath Entry Page (for Kender Pramukh)
exports.getGroupPaath = async (req, res) => {
  try {
    const user = req.session.user;

    // Only Kender Pramukh access check (you can extend role check)
    if (!user.kender) return res.status(403).send("Not authorized.");

    // Fetch all Saadhaks of this Kender
    const saadhaks = await Saadhak.find({ kender: user.kender })
      .sort({ name: 1 })
      .select("name mobile _id");

    const today = new Date().toISOString().slice(0, 10);

    res.render("group-paath", {
      user,
      saadhaks,
      today,
    });
  } catch (err) {
    console.error("Error loading group paath page:", err);
    res.status(500).send("Error loading group paath page");
  }
};

// 🌸 AJAX: Get paath data for all saadhaks on selected date
exports.getGroupPaathByDate = async (req, res) => {
  try {
    const { date, kenderId } = req.query;

    // 1️⃣ Get all saadhaks under this kender
    const saadhaks = await Saadhak.find({ kender: kenderId })
      .select("_id name mobile")
      .sort({ name: 1 });

    // 2️⃣ Get their paath counts for this date
    const paaths = await Paath.find({ date, user: { $in: saadhaks.map(s => s._id) } });

    // 3️⃣ Merge data
    const result = saadhaks.map(s => {
      const record = paaths.find(p => p.user.toString() === s._id.toString());
      return {
        _id: s._id,
        name: s.name,
        mobile: s.mobile,
        count: record ? record.count : 0,
      };
    });

    // Debug
    // console.log("Group Paath:", result);

    res.json(result);
  } catch (err) {
    console.error("Error fetching group paath:", err);
    res.status(500).json({ error: "Error fetching data" });
  }
};

// 🌸 AJAX: Save/update multiple entries
exports.saveGroupPaath = async (req, res) => {
  try {
    const { date, entries, kenderId } = req.body; // entries = [{ saadhakId, count }]
    if (!date || !Array.isArray(entries)) {
      return res.status(400).json({ error: "Invalid input" });
    }

    // 🧹 Step 1: Delete all existing paath entries for this date & kender
    await Paath.deleteMany({ kender: kenderId, date });

    // 🌿 Step 2: Insert only non-zero entries
    const validEntries = entries.filter(e => Number(e.count) > 0);
    for (const e of validEntries) {
      const n = Number(e.count || 0);
      await Paath.findOneAndUpdate(
        { user: e.saadhakId, date },
        { user: e.saadhakId, date, count: n, kender: kenderId },
        { upsert: true }
      );
    }

    // 🌼 Step 3: Calculate total for confirmation
    const total = validEntries.reduce((sum, e) => sum + (Number(e.count) || 0), 0);

    res.json({ message: "Saved successfully", total });
  } catch (err) {
    console.error("Error saving group paath:", err);
    res.status(500).json({ error: "Error saving paath data" });
  }
};
