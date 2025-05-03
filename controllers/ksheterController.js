const Ksheter = require("../models/Ksheter");
const Zila = require("../models/Zila");
const Saadhak = require("../models/Saadhak");

const { formatName, validateName } = require("../utils/formatters");

exports.showAddForm = async (req, res) => {
  try {
    const user = req.session.user;

    let zilas;

    if (user.roles.includes('Admin')) {
      // Admin can see all Zilas
      zilas = await Zila.find().sort({ name: 1 });
    } else if (user.roles.includes('Zila Pradhan') || user.roles.includes('Zila Mantri')) {
      // Zila Pradhan/Mantri can see only their assigned Zila

      // Fetch logged-in user's full Saadhak profile
      const saadhak = await Saadhak.findById(user.id);

      if (saadhak && saadhak.zila) {
        zilas = await Zila.find({ _id: saadhak.zila });
      } else {
        zilas = []; // No zilas assigned, no options
      }
    } else {
      zilas = []; // Other users — no access
    }

    res.render("ksheter/add", {
      zilas,
      formData: {},
      error: null,
      user: req.session.user
    });

  } catch (err) {
    console.error('Error showing Ksheter Add Form:', err);
    res.status(500).send('Server Error');
  }
};

exports.createKsheter = async (req, res) => {
  try {
    let { name, zila } = req.body;

    const formData = { name, zila }; // ✅ retain entered values

    if (!validateName(name)) {
      const zilas = await Zila.find();
      return res.render("ksheter/add", {
        zilas,
        error: "❌ Ksheter name must contain only alphabets and spaces.",
        formData
      });
    }

    name = formatName(name);

    const existing = await Ksheter.findOne({ name, zila });
    if (existing) {
      const zilas = await Zila.find();
      return res.render("ksheter/add", {
        zilas,
        error: "⚠️ A Ksheter with this name already exists under the selected Zila.",
        formData
      });
    }

    const ksheter = new Ksheter({ name, zila });
    await ksheter.save();
    res.redirect("/ksheter/manage");
  } catch (err) {
    console.error("❌ Error creating Ksheter:", err);
    const zilas = await Zila.find();
    res.render("ksheter/add", {
      zilas,
      error: "❌ Something went wrong while saving Ksheter.",
      formData: req.body
    });
  }
};

// controllers/ksheterController.js

exports.listKsheter = async (req, res) => {
  try {
    const selectedZilaId = req.query.zila; // From dropdown
    const user = req.session.user;

    let query = {};

    if (user.roles.includes("Admin")) {
      // Admin can filter by selected Zila or view all
      if (selectedZilaId) {
        query.zila = selectedZilaId;
      }
    } else if (
      user.roles.includes("Zila Pradhan") ||
      user.roles.includes("Zila Mantri")
    ) {
      // Zila team sees only their Zila (always)
      query.zila = user.zila;
    }

    const zilas = await Zila.find().sort({ name: 1 });
    const ksheters = await Ksheter.find(query).populate("zila").sort({ name: 1 });

    res.render("ksheter/list", {
      ksheters,
      zilas,
      selectedZilaId: selectedZilaId || (user.zila || null),
      user
    });
  } catch (err) {
    console.error("Error listing Ksheters:", err);
    res.status(500).send("Server Error");
  }
};


exports.showEditForm = async (req, res) => {
  try {
    const user = req.session.user;
    const ksheter = await Ksheter.findById(req.params.id);

    if (!ksheter) {
      return res.status(404).send('❌ Ksheter not found.');
    }

    let zilas;

    if (user.roles.includes('Admin')) {
      // Admin can see all zilas
      zilas = await Zila.find().sort({ name: 1 });
    } else if (user.roles.includes('Zila Pradhan') || user.roles.includes('Zila Mantri')) {
      const saadhak = await Saadhak.findById(user.id);

      if (saadhak && saadhak.zila) {
        zilas = await Zila.find({ _id: saadhak.zila });
      } else {
        zilas = []; // No zila assigned
      }
    } else {
      zilas = [];
    }

    res.render('ksheter/edit', { ksheter, zilas, error: null });

  } catch (err) {
    console.error('Error showing Edit Form:', err);
    res.status(500).send('Server Error');
  }
};

exports.updateKsheter = async (req, res) => {
  let { name, zila } = req.body;
  const ksheterId = req.params.id;

  if (!validateName(name)) {
    const ksheter = await Ksheter.findById(ksheterId);
    const zilas = await Zila.find();
    return res.render("ksheter/edit", {
      ksheter,
      zilas,
      error: "❌ Ksheter name must contain only alphabets and spaces.",
    });
  }

  name = formatName(name);
  const existing = await Ksheter.findOne({
    name,
    zila,
    _id: { $ne: ksheterId },
  });
  if (existing) {
    const ksheter = await Ksheter.findById(ksheterId);
    const zilas = await Zila.find();
    return res.render("ksheter/edit", {
      ksheter,
      zilas,
      error:
        "⚠️ A Ksheter with this name already exists under the selected Zila.",
    });
  }

  await Ksheter.findByIdAndUpdate(ksheterId, { name, zila });
  res.redirect("/ksheter/manage");
};

exports.deleteKsheter = async (req, res) => {
  try {
    const ksheter = await Ksheter.findById(req.params.id);
    if (!ksheter) return res.status(404).send("Ksheter not found.");

    const zilaId = ksheter.zila?.toString(); // 🔁 Preserve for redirect

    await Ksheter.findByIdAndDelete(req.params.id);

    // 🔁 Redirect back with selected Zila if possible
    res.redirect(`/ksheter/manage?zila=${zilaId}`);
  } catch (err) {
    console.error("Error deleting Ksheter:", err);
    res.status(500).send("Server Error during delete.");
  }
};