const Ksheter = require("../models/Ksheter");
const Zila = require("../models/Zila");
const Saadhak = require("../models/Saadhak");
const { zilaRoles } = require("../config/roles");
const { formatName, validateName } = require("../utils/formatters");

// ✅ Helper: Get accessible Zilas based on user role
async function getAccessibleZilas(user) {
  if (user.roles.includes("Admin")) {
    return await Zila.find().sort({ name: 1 });
  } else if (user.roles.some((role) => zilaRoles.includes(role))) {
    const saadhak = await Saadhak.findById(user.id);
    if (saadhak && saadhak.zila) {
      return await Zila.find({ _id: saadhak.zila });
    }
  }
  return []; // No access or no zila assigned
}

exports.showAddForm = async (req, res) => {
  try {
    const user = req.session.user;
    const zilas = await getAccessibleZilas(user);

    res.render("ksheter/add", {
      zilas,
      formData: {},
      error: null,
      user,
    });
  } catch (err) {
    console.error("Error showing Ksheter Add Form:", err);
    res.status(500).send("Server Error");
  }
};

exports.createKsheter = async (req, res) => {
  try {
    let { name, zila } = req.body;
    const formData = { name, zila };

    if (!validateName(name)) {
      const zilas = await Zila.find();
      return res.render("ksheter/add", {
        zilas,
        error: "❌ Ksheter name must contain only alphabets and spaces.",
        formData,
      });
    }

    name = formatName(name);

    const existing = await Ksheter.findOne({ name, zila });
    if (existing) {
      const zilas = await Zila.find();
      return res.render("ksheter/add", {
        zilas,
        error:
          "⚠️ A Ksheter with this name already exists under the selected Zila.",
        formData,
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
      formData: req.body,
    });
  }
};

exports.listKsheter = async (req, res) => {
  try {
    
    const selectedZilaId = req.query.zila;
    const user = req.session.user;
    // console.log(user);

    let query = {};

    if (user.roles.includes("Admin")) {
      if (selectedZilaId) {
        query.zila = selectedZilaId;
      }
    } else if (user.roles.some((role) => zilaRoles.includes(role))) {
      query.zila = user.zila;
    }

    const zilas = await Zila.find().sort({ name: 1 });
    const ksheters = await Ksheter.find(query)
      .populate("zila")
      .sort({ name: 1 });

    res.render("ksheter/list", {
      ksheters,
      zilas,
      selectedZilaId: selectedZilaId || user.zila || null,
      user,
      error: null,
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
    if (!ksheter) return res.status(404).send("❌ Ksheter not found.");

    const zilas = await getAccessibleZilas(user);

    res.render("ksheter/edit", {
      ksheter,
      zilas,
      error: null,
    });
  } catch (err) {
    console.error("Error showing Edit Form:", err);
    res.status(500).send("Server Error");
  }
};

exports.updateKsheter = async (req, res) => {
  try {
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
  } catch (err) {
    console.error("❌ Error updating Ksheter:", err);
    res.status(500).send("Server Error");
  }
};

exports.deleteKsheter = async (req, res) => {
  try {
    const ksheterId = req.params.id;

    const ksheter = await Ksheter.findById(ksheterId);
    if (!ksheter) return res.status(404).send("Ksheter not found.");

    const zilaId = ksheter.zila?.toString(); // 🔁 Preserve for redirect

    // Check for existing Saadhaks under this Ksheter
    const linkedSaadhaks = await Saadhak.findOne({ ksheter: ksheterId });
    if (linkedSaadhaks) {
      // Send back with warning
      return res.render("ksheter/list", {
        ksheters: await Ksheter.find({ zila: zilaId }).sort({ name: 1 }).populate("zila"),
        zilas: await Zila.find().sort({ name: 1 }),
        selectedZilaId: zilaId,
        user: req.session.user,
        error: "⚠️ Cannot delete this Ksheter because some Saadhaks are linked to it."
      });
    }

    await Ksheter.findByIdAndDelete(ksheterId);
    res.redirect(`/ksheter/manage?zila=${zilaId}`);
  } catch (err) {
    console.error("Error deleting Ksheter:", err);
    res.status(500).send("Server Error during delete.");
  }
};
