const Kender = require("../models/Kender");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Saadhak = require("../models/Saadhak");
const { formatName, validateName } = require("../utils/formatters");

// ✅ Show Add Form
exports.showAddForm = async (req, res) => {
  try {
    const user = req.session.user;

    let zilas = [];
    let ksheters = [];

    if (user.roles.includes("Admin")) {
      // Admin can see all
      zilas = await Zila.find().sort({ name: 1 });
      ksheters = await Ksheter.find().sort({ name: 1 }).populate("zila");
    } else {
      const saadhak = await Saadhak.findById(user.id)
        .populate("zila")
        .populate("ksheter");

      if (!saadhak) {
        return res.status(400).send("❌ Saadhak data not found.");
      }

      if (
        user.roles.includes("Zila Pradhan") ||
        user.roles.includes("Zila Mantri")
      ) {
        // Zila team - see their Zila, all Ksheter under Zila
        if (saadhak.zila) {
          zilas = [saadhak.zila];
          ksheters = await Ksheter.find({ zila: saadhak.zila._id }).populate(
            "zila"
          );
        }
      } else if (
        user.roles.includes("Ksheter Pradhan") ||
        user.roles.includes("Ksheter Mantri")
      ) {
        // Ksheter team - see only their Ksheter
        if (saadhak.zila && saadhak.ksheter) {
          zilas = [saadhak.zila];
          ksheters = [saadhak.ksheter];
        }
      }
    }

    res.render("kender/add", {
      zilas: await Zila.find().sort({ name: 1 }),
      ksheters: await Ksheter.find().sort({ name: 1 }),
      formData: {}, // for sticky form
      error: null,
      user: req.session.user
    });
  } catch (err) {
    console.error("Error showing Kender Add Form:", err);
    res.status(500).send("Server Error");
  }
};
// ✅ Create New Kender
exports.createKender = async (req, res) => {
  try {
    const { name, address, zila, ksheter } = req.body;
    const user = req.session.user;

    const formData = { name, address, zila, ksheter };

    // ✅ Validate required fields
    if (!name || !address || !zila || !ksheter) {
      const zilas = await Zila.find();
      const ksheters = await Ksheter.find({ zila });
      return res.render("kender/add", {
        error: "❌ All fields are required.",
        zilas,
        ksheters,
        formData,
        user
      });
    }

    // ✅ Validate name (only alphabets and numbers)
    if (!validateName(name)) {
      const zilas = await Zila.find();
      const ksheters = await Ksheter.find({ zila });
      return res.render("kender/add", {
        error: "❌ Kender name must contain only alphabets and numbers.",
        zilas,
        ksheters,
        formData,
        user
      });
    }

    // ✅ Format name and address
    const formattedName = formatName(name.trim());
    const formattedAddress = formatName(address.trim());

    // ✅ Check for duplicate in same Zila and Ksheter
    const existing = await Kender.findOne({
      name: formattedName,
      zila,
      ksheter
    });

    if (existing) {
      const zilas = await Zila.find();
      const ksheters = await Ksheter.find({ zila });
      return res.render("kender/add", {
        error: "⚠️ A Kender with this name already exists under the selected Zila and Ksheter.",
        zilas,
        ksheters,
        formData,
        user
      });
    }

    // ✅ Save Kender
    const newKender = new Kender({
      name: formattedName,
      address: formattedAddress,
      zila,
      ksheter
    });

    await newKender.save();
    res.redirect("/kender/manage");

  } catch (err) {
    console.error("❌ Error creating Kender:", err);
    const zilas = await Zila.find();
    const ksheters = await Ksheter.find({ zila: req.body.zila });
    res.render("kender/add", {
      error: "❌ Server Error while saving.",
      zilas,
      ksheters,
      formData: req.body,
      user: req.session.user
    });
  }
};

// ✅ List All Kenders
exports.listKenders = async (req, res) => {
  try {
    const user = req.session.user;
    const allZilas = await Zila.find().sort({ name: 1 });
    const allKsheters = await Ksheter.find().sort({ name: 1 });

    let selectedZila = req.query.zila || '';
    let selectedKsheter = req.query.ksheter || '';

    // Adjust filters based on user role
    if (user.roles.includes('Zila Pradhan') || user.roles.includes('Zila Mantri')) {
      selectedZila = user.zila;
    }

    if (user.roles.includes('Ksheter Pradhan') || user.roles.includes('Ksheter Mantri')) {
      selectedZila = user.zila;
      selectedKsheter = user.ksheter;
    }

    // Build query
    const query = {};
    if (selectedZila) query.zila = selectedZila;
    if (selectedKsheter) query.ksheter = selectedKsheter;

    const kenders = await Kender.find(query)
      .populate('zila')
      .populate('ksheter')
      .sort({ name: 1 });

    res.render('kender/list', {
      kenders,
      zilas: allZilas,
      ksheters: allKsheters,
      selectedZila,
      selectedKsheter,
      user,
    });

  } catch (err) {
    console.error('Error fetching Kenders:', err);
    res.status(500).send('Server Error');
  }
};

exports.listByKsheter = async (req, res) => {
  try {
    const ksheterId = req.params.id;
    const ksheter = await Ksheter.findById(ksheterId).populate("zila");

    const kenders = await Kender.find({ ksheter: ksheterId })
      .populate("zila")
      .populate("ksheter")
      .sort({ name: 1 });

    res.render("kender/by-ksheter", {
      ksheter,
      kenders,
    });
  } catch (err) {
    console.error("❌ Error fetching Kenders by Ksheter:", err);
    res.status(500).send("Server Error");
  }
};

exports.showEditForm = async (req, res) => {
  try {
    const user = req.session.user;
    const kender = await Kender.findById(req.params.id)
      .populate("zila")
      .populate("ksheter");

    if (!kender) {
      return res.status(404).send("❌ Kender not found.");
    }

    let zilas = [];
    let ksheters = [];

    if (user.roles.includes("Admin")) {
      // Admin: All Zila and Ksheter
      zilas = await Zila.find().sort({ name: 1 });
      ksheters = await Ksheter.find().sort({ name: 1 });
    } else {
      // Non-admin: fetch user's assigned zila/ksheter
      const saadhak = await Saadhak.findById(user.id).populate("zila ksheter");

      if (!saadhak) {
        return res.status(400).send("❌ Saadhak not found.");
      }

      if (user.roles.includes("Zila Pradhan") || user.roles.includes("Zila Mantri")) {
        if (saadhak.zila) {
          zilas = [saadhak.zila];
          ksheters = await Ksheter.find({ zila: saadhak.zila._id });
        }
      } else if (user.roles.includes("Ksheter Pradhan") || user.roles.includes("Ksheter Mantri")) {
        if (saadhak.zila && saadhak.ksheter) {
          zilas = [saadhak.zila];
          ksheters = [saadhak.ksheter];
        }
      }
    }
    console.log(zilas);
    // ✅ Add `user` to the render context
    res.render("kender/edit", {
      kender,
      zilas,
      ksheters,
      error: null,
      user, // important!
    });

  } catch (err) {
    console.error("Error showing Kender Edit Form:", err);
    res.status(500).send("Server Error");
  }
};

// ✅ Update Existing Kender
exports.updateKender = async (req, res) => {
  try {
    const { name, ksheter, zila, address } = req.body;
    const user = req.session.user;
    const kenderId = req.params.id;

    // ✅ Re-fetch existing kender
    const kender = await Kender.findById(kenderId).populate("zila ksheter");

    // ✅ Required fields check
    if (!name || !ksheter || !zila || !address) {
      const zilas = await Zila.find().sort({ name: 1 });
      const ksheters = await Ksheter.find({ zila }).sort({ name: 1 });

      return res.render("kender/edit", {
        kender,
        zilas,
        ksheters,
        error: "❌ All fields are required.",
        user
      });
    }

    // ✅ Validate name (alphabets and space)
    if (!validateName(name)) {
      const zilas = await Zila.find().sort({ name: 1 });
      const ksheters = await Ksheter.find({ zila }).sort({ name: 1 });

      return res.render("kender/edit", {
        kender,
        zilas,
        ksheters,
        error: "❌ Kender name must contain only alphabets and spaces.",
        user
      });
    }

    // ✅ Format name and address
    const formattedName = formatName(name.trim());
    const formattedAddress = formatName(address.trim());

    // ✅ Check for duplicates (ignore self)
    const existing = await Kender.findOne({
      _id: { $ne: kenderId },
      name: formattedName,
      zila,
      ksheter
    });

    if (existing) {
      const zilas = await Zila.find().sort({ name: 1 });
      const ksheters = await Ksheter.find({ zila }).sort({ name: 1 });

      return res.render("kender/edit", {
        kender,
        zilas,
        ksheters,
        error: "⚠️ A Kender with this name already exists under the selected Zila and Ksheter.",
        user
      });
    }

    // ✅ Update
    await Kender.findByIdAndUpdate(kenderId, {
      name: formattedName,
      address: formattedAddress,
      ksheter,
      zila
    });

    res.redirect("/kender/manage");

  } catch (err) {
    console.error("❌ Error updating Kender:", err);
    res.status(500).send("Server Error while updating Kender.");
  }
};

// ✅ Delete Kender
exports.deleteKender = async (req, res) => {
  try {
    const kenderId = req.params.id;

    await Kender.findByIdAndDelete(kenderId);

    res.redirect("/kender/manage");
  } catch (err) {
    console.error("Error deleting Kender:", err);
    res.status(500).send("Server Error while deleting Kender.");
  }
};
