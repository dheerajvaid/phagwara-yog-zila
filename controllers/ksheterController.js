const Ksheter = require("../models/Ksheter");
const Zila = require("../models/Zila");
const Saadhak = require("../models/Saadhak");
const Prant = require("../models/Prant"); // 👈 Import Prant model
const { zilaRoles, prantRoles, adminRoles } = require("../config/roles"); // 👈 Import prantRoles
const { formatName, validateName } = require("../utils/formatters");
const allowedRoles = [...adminRoles, ...zilaRoles, ...prantRoles];
const roleConfig = require("../config/roles");

// ✅ Helper: Get accessible Zilas based on user role
async function getAccessibleZilas(user) {
  if (user.roles.some((role) => adminRoles.includes(role))) {
    // Admins see all Zilas
    return await Zila.find().sort({ name: 1 });
  } else if (user.roles.some((role) => prantRoles.includes(role))) {
    // Prant-level users see Zilas under their Prant
    return await Zila.find({ prant: user.prant }).sort({ name: 1 });
  } else if (user.roles.some((role) => zilaRoles.includes(role))) {
    // Zila-level users see only their own Zila
    return await Zila.find({ _id: user.zila }).sort({ name: 1 });
  }
  return [];
}

exports.showAddForm = async (req, res) => {
  try {
    const user = req.session.user;
    const zilas = await getAccessibleZilas(user);
    // const prants = await getAccessiblePrants(user); // 👈 New line

    res.render("ksheter/add", {
      zilas,
      prant: user.prant, // 👈 Pass prants to view
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
    const user = req.session.user;

    if (!validateName(name, true, "-.()")) {
      const zilas = await Zila.find();
      return res.render("ksheter/add", {
        zilas,
        error: "❌ Ksheter name must contain only alphabets, numbers, -.()",
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

    const ksheter = new Ksheter({ name, zila, prant: user.prant });
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

// ✅ View All Ksheters (filtered by role)
exports.listKsheter = async (req, res) => {
  try {
    const selectedZilaId = req.query.zila;
    const user = req.session.user;
    const { adminRoles, prantRoles, zilaRoles } = require("../config/roles");

    let query = {};
    let zilaQuery = {};

    const roles = Array.isArray(user.roles) ? user.roles : [user.role].filter(Boolean);

    // ✅ Admin / Prant logic
    if (roles.some((r) => adminRoles.includes(r))) {
      // Admin: see all
      if (selectedZilaId && selectedZilaId !== "all") query.zila = selectedZilaId;
    } 
    else if (roles.some((r) => prantRoles.includes(r))) {
      // Prant user: see only their Prant’s Zilas
      const prantId =
        typeof user.prant === "object" && user.prant._id ? user.prant._id : user.prant;

      zilaQuery = { prant: prantId };
      if (selectedZilaId && selectedZilaId !== "all") query.zila = selectedZilaId;
      else query = { zila: { $in: await Zila.find(zilaQuery).distinct("_id") } };
    } 
    else if (roles.some((r) => zilaRoles.includes(r))) {
      // Zila user: only their Zila
      query.zila = user.zila;
      zilaQuery = { _id: user.zila };
    } 
    else {
      return res.render("ksheter/list", {
        ksheters: [],
        zilas: [],
        selectedZilaId: null,
        user,
        error: "You are not authorized to view Ksheter data.",
        adminRoles,
        prantRoles,
        zilaRoles,
      });
    }

    // ✅ Fetch only applicable Zilas
    const zilas = await Zila.find(zilaQuery).sort({ name: 1 });

    // ✅ Fetch Ksheters
    const ksheters = await Ksheter.find(query)
      .populate("zila")
      .sort({ name: 1 });

    res.render("ksheter/list", {
      ksheters,
      zilas,
      selectedZilaId: selectedZilaId || user.zila || null,
      user,
      error: null,
      adminRoles,
      zilaRoles,
      prantRoles,
    });
  } catch (err) {
    console.error("❌ Error listing Ksheters:", err);
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

    if (!validateName(name, true, ".-()")) {
      const ksheter = await Ksheter.findById(ksheterId);
      const zilas = await Zila.find();
      return res.render("ksheter/edit", {
        ksheter,
        zilas,
        error: "❌ Ksheter name must contain only alphabets, numbers, -.()",
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
        ksheters: await Ksheter.find({ zila: zilaId })
          .sort({ name: 1 })
          .populate("zila"),
        zilas: await Zila.find().sort({ name: 1 }),
        selectedZilaId: zilaId,
        user: req.session.user,
        adminRoles: roleConfig.adminRoles,
        zilaRoles: roleConfig.zilaRoles,
        prantRoles: roleConfig.prantRoles,
        error:
          "⚠️ Cannot delete this Ksheter because some Saadhaks are linked to it.",
      });
    }

    await Ksheter.findByIdAndDelete(ksheterId);
    res.redirect(`/ksheter/manage?zila=${zilaId}`);
  } catch (err) {
    console.error("Error deleting Ksheter:", err);
    res.status(500).send("Server Error during delete.");
  }
};
