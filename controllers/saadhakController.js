const Saadhak = require("../models/Saadhak");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const {
  validateMobile,
  validateName,
  validateDOB,
} = require("../utils/validators");
const { formatName } = require('../utils/formatters');

const { ALL_ROLES } = require("../utils/roles");


exports.showAddForm = async (req, res) => {
  const user = req.session.user;

  let allowedRoles = ["Saadhak"]; // Default

  if (user.roles.includes("Admin")) {
    allowedRoles = ALL_ROLES;
  } else if (
    user.roles.includes("Zila Pradhan") 
  ) {
    allowedRoles = ALL_ROLES.filter(
      (role) => !["Admin", "Zila Pradhan"].includes(role)
    );
  } else if (
    user.roles.includes("Zila Mantri") 
  ) {
    allowedRoles = ALL_ROLES.filter(
      (role) => !["Admin", "Zila Pradhan", "Zila Mantri"].includes(role)
    );
  } else if (
    user.roles.includes("Ksheter Pradhan") ||
    user.roles.includes("Ksheter Mantri")
  ) {
    allowedRoles = [
      "Saadhak",
      "Karyakarta",
      "Shikshak",
      "Seh Kender Pramukh",
      "Kender Pramukh",
    ];
  } else if (
    user.roles.includes("Kender Pramukh") ||
    user.roles.includes("Seh Kender Pramukh")
  ) {
    allowedRoles = ["Saadhak", "Karyakarta", "Shikshak"];
  }

  const zilas = await Zila.find();
  const ksheters = await Ksheter.find();
  const kenders = await Kender.find();

  res.render("saadhak/add", {
    zilas,
    ksheters,
    kenders,
    allowedRoles,
    formData: {}, // For error recovery
    error: null,
    user: req.session.user,
  });
};
// ✅ Handle Create
exports.createSaadhak = async (req, res) => {
  try {
    const {
      name,
      mobile,
      dob,
      gender,
      maritalStatus,
      marriageDate,
      address,
      livingArea,
      role,
      zila,
      ksheter,
      kender,
    } = req.body;

    const formData = {
      name,
      mobile,
      dob,
      gender,
      maritalStatus,
      marriageDate,
      address,
      livingArea,
      role,
      zila,
      ksheter,
      kender,
    };

    const user = req.session.user;

    // Compute allowedRoles based on logged-in user
    let allowedRoles = ["Saadhak"];
    if (user.roles.includes("Admin")) {
      allowedRoles = ALL_ROLES;
    } else if (
      user.roles.includes("Zila Pradhan") 
    ) {
      allowedRoles = ALL_ROLES.filter(
        (role) => !["Admin", "Zila Pradhan"].includes(role)
      );
    } else if (
      user.roles.includes("Zila Mantri") 
    ) {
      allowedRoles = ALL_ROLES.filter(
        (role) => !["Admin", "Zila Pradhan", "Zila Mantri"].includes(role)
      );
    } else if (
      user.roles.includes("Ksheter Pradhan") ||
      user.roles.includes("Ksheter Mantri")
    ) {
      allowedRoles = [
        "Saadhak",
        "Karyakarta",
        "Shikshak",
        "Seh Kender Pramukh",
        "Kender Pramukh",
      ];
    } else if (
      user.roles.includes("Kender Pramukh") ||
      user.roles.includes("Seh Kender Pramukh")
    ) {
      allowedRoles = ["Saadhak", "Karyakarta", "Shikshak"];
    }
    // Validations

    if (!validateName(name)) {
      return res.render("saadhak/add", {
        error: "❌ Name should contain only alphabets and spaces",
        zilas: await Zila.find(),
        ksheters: await Ksheter.find(),
        kenders: await Kender.find(),
        formData,
        allowedRoles,
      });
    }

    if (!validateMobile(mobile)) {
      return res.render("saadhak/add", {
        error: "❌ Invalid Mobile Number",
        zilas: await Zila.find(),
        ksheters: await Ksheter.find(),
        kenders: await Kender.find(),
        formData,
        allowedRoles,
      });
    }

    const existing = await Saadhak.findOne({ mobile });
    if (existing) {
      return res.render("saadhak/add", {
        error: "❌ Mobile number already registered.",
        formData: req.body,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find(),
        kenders: await Kender.find(),
        allowedRoles,
      });
    }

    if (!name || !mobile || !role) {
      return res.render("saadhak/add", {
        error: "❌ Name, Mobile, and Role are required.",
        formData: req.body,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find(),
        kenders: await Kender.find(),
        allowedRoles,
      });
    }

    // Optional field validations only if present
    if (dob && !validateDOB(dob)) {
      return res.render("saadhak/add", {
        error: "❌ Invalid Date of Birth",
        formData: req.body,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find(),
        kenders: await Kender.find(),
        allowedRoles,
      });
    }

    if (
      marriageDate &&
      maritalStatus === "Married" &&
      !validateDOB(marriageDate)
    ) {
      return res.render("saadhak/add", {
        error: "❌ Invalid Marriage Date",
        formData: req.body,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find(),
        kenders: await Kender.find(),
        allowedRoles,
      });
    }

    // Role-wise association check
    if (
      ["Zila Pradhan", "Zila Mantri", "Sangathan Mantri", "Cashier"].includes(
        role
      ) &&
      !zila
    ) {
      return res.render("saadhak/add", {
        error: "❌ Zila selection is required for Zila-level roles.",
        formData: req.body,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find(),
        kenders: await Kender.find(),
        allowedRoles,
      });
    }

    console.log(zila + " - " + !zila);
    console.log(ksheter + " - " + !ksheter);

    if (
      ["Ksheter Pradhan", "Ksheter Mantri"].includes(role) &&
      (!zila || !ksheter)
    ) {
        return res.render("saadhak/add", {
        error: "❌ Zila and Ksheter must be selected for Ksheter-level roles.",
        formData: req.body,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find(),
        kenders: await Kender.find(),
        allowedRoles,
      });
    }

    if (
      [
        "Kender Pramukh",
        "Seh Kender Pramukh",
        "Shikshak",
        "Karyakarta",
        "Saadhak",
      ].includes(role) &&
      (!zila || !ksheter || !kender)
    ) {
      return res.render("saadhak/add", {
        error:
          "❌ Zila, Ksheter, and Kender must be selected for Kender-level roles.",
        formData: req.body,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find(),
        kenders: await Kender.find(),
        allowedRoles,
      });
    }

    // Save Saadhak
    const saadhak = new Saadhak({
      name: formatName(name.trim()),
      mobile,
      dob,
      gender,
      maritalStatus,
      marriageDate: maritalStatus === "Married" ? marriageDate : undefined,
      address,
      livingArea,
      role,
      zila: zila || undefined,
      ksheter: ksheter || undefined,
      kender: kender || undefined,
    });

    await saadhak.save();
    res.redirect("/saadhak/manage");
  } catch (err) {
    console.error("❌ Error creating Saadhak:", err);
    res.status(500).send("Server Error");
  }
};

// ✅ List All Saadhaks
exports.listSaadhaks = async (req, res) => {
  try {
    const user = req.session.user;

    let query = {};

    if (!user.roles.includes("Admin")) {
      if (user.roles.includes("Zila Pradhan") || user.roles.includes("Zila Mantri")) {
        query.zila = user.zila;
      }
      if (user.roles.includes("Ksheter Pradhan") || user.roles.includes("Ksheter Mantri")) {
        query.ksheter = user.ksheter;
      }
      if (user.roles.includes("Kender Pramukh") || user.roles.includes("Seh Kender Pramukh")) {
        query.kender = user.kender;
      }
    }
    

    const saadhaks = await Saadhak.find(query)
      .populate("zila")
      .populate("ksheter")
      .populate("kender")
      .sort({ name: 1 });

    const zilas = await Zila.find().sort({ name: 1 });
    const ksheters = await Ksheter.find().sort({ name: 1 });
    const kenders = await Kender.find().sort({ name: 1 });

    console.log(user.zila);
    console.log(user.Ksheter);
    console.log(user.Kender);
    
    res.render("saadhak/list", {
      saadhaks,
      zilas,
      ksheters,
      kenders,
      user,
    });
  } catch (err) {
    console.error("❌ Error listing Saadhaks:", err);
    res.status(500).send("Server Error");
  }
};

// ✅ Show Edit Form
exports.showEditForm = async (req, res) => {
  try {
    const user = req.session.user;
    const saadhak = await Saadhak.findById(req.params.id);
    
    // console.log(req.session.user);

    const zilas = await Zila.find().sort({ name: 1 });
    const ksheters = await Ksheter.find({ zila: saadhak.zila }).sort({ name: 1 });
    const kenders = await Kender.find({ ksheter: saadhak.ksheter }).sort({ name: 1 });

    // console.log(kenders);

    // ✅ Determine allowedRoles based on the logged-in user
    let allowedRoles = ["Saadhak"];
    if (user.roles.includes("Admin")) {
      allowedRoles = ALL_ROLES;
    } else if (user.roles.includes("Zila Pradhan")) {
      allowedRoles = ALL_ROLES.filter(role => !["Admin", "Zila Pradhan"].includes(role));
    } else if (user.roles.includes("Zila Mantri")) {
      allowedRoles = ALL_ROLES.filter(role => !["Admin", "Zila Pradhan", "Zila Mantri"].includes(role));
    } else if (user.roles.includes("Ksheter Pradhan") || user.roles.includes("Ksheter Mantri")) {
      allowedRoles = ["Saadhak", "Karyakarta", "Shikshak", "Seh Kender Pramukh", "Kender Pramukh"];
    } else if (user.roles.includes("Kender Pramukh") || user.roles.includes("Seh Kender Pramukh")) {
      allowedRoles = ["Saadhak", "Karyakarta", "Shikshak"];
    }

    // console.log(kenders);
    // console.log("------");
    // console.log(saadhak);

    res.render("saadhak/edit", {
      saadhak,
      zilas,
      ksheters,
      kenders,
      allowedRoles, // ✅ Fix: pass this to EJS
      error: null
    });

  } catch (err) {
    console.error("Error loading Saadhak for editing:", err);
    res.status(500).send("Server Error");
  }
};

// ✅ Handle Update
exports.updateSaadhak = async (req, res) => {
  try {
    const {
      name,
      mobile,
      dob,
      gender,
      maritalStatus,
      marriageDate,
      address,
      livingArea,
      role,
      zila,
      ksheter,
      kender,
    } = req.body;

    const user = req.session.user;
    const saadhakId = req.params.id;

    const formData = {
      name,
      mobile,
      dob,
      gender,
      maritalStatus,
      marriageDate,
      address,
      livingArea,
      role,
      zila,
      ksheter,
      kender,
    };

    // Role logic
    let allowedRoles = ["Saadhak"];
    if (user.roles.includes("Admin")) {
      allowedRoles = ALL_ROLES;
    } else if (user.roles.includes("Zila Pradhan")) {
      allowedRoles = ALL_ROLES.filter(r => !["Admin", "Zila Pradhan"].includes(r));
    } else if (user.roles.includes("Zila Mantri")) {
      allowedRoles = ALL_ROLES.filter(r => !["Admin", "Zila Pradhan", "Zila Mantri"].includes(r));
    } else if (user.roles.includes("Ksheter Pradhan") || user.roles.includes("Ksheter Mantri")) {
      allowedRoles = ["Saadhak", "Karyakarta", "Shikshak", "Seh Kender Pramukh", "Kender Pramukh"];
    } else if (user.roles.includes("Kender Pramukh") || user.roles.includes("Seh Kender Pramukh")) {
      allowedRoles = ["Saadhak", "Karyakarta", "Shikshak"];
    }

    // Validations
    if (!validateName(name)) {
      return res.render("saadhak/edit", {
        error: "❌ Name should contain only alphabets and spaces",
        saadhak: formData,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find({ zila }),
        kenders: await Kender.find({ ksheter }),
        allowedRoles,
        user,
      });
    }

    if (!validateMobile(mobile)) {
      return res.render("saadhak/edit", {
        error: "❌ Invalid Mobile Number",
        saadhak: formData,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find({ zila }),
        kenders: await Kender.find({ ksheter }),
        allowedRoles,
        user,
      });
    }

    const existing = await Saadhak.findOne({ mobile });
    if (existing && existing._id.toString() !== saadhakId) {
      return res.render("saadhak/edit", {
        error: "❌ Mobile number already registered with another Saadhak.",
        saadhak: formData,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find({ zila }),
        kenders: await Kender.find({ ksheter }),
        allowedRoles,
        user,
      });
    }

    if (!name || !mobile || !role) {
      return res.render("saadhak/edit", {
        error: "❌ Name, Mobile, and Role are required.",
        saadhak: formData,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find({ zila }),
        kenders: await Kender.find({ ksheter }),
        allowedRoles,
        user,
      });
    }

    if (dob && !validateDOB(dob)) {
      return res.render("saadhak/edit", {
        error: "❌ Invalid Date of Birth",
        saadhak: formData,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find({ zila }),
        kenders: await Kender.find({ ksheter }),
        allowedRoles,
        user,
      });
    }

    if (
      marriageDate &&
      maritalStatus === "Married" &&
      !validateDOB(marriageDate)
    ) {
      return res.render("saadhak/edit", {
        error: "❌ Invalid Marriage Date",
        saadhak: formData,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find({ zila }),
        kenders: await Kender.find({ ksheter }),
        allowedRoles,
        user,
      });
    }

    // Role-specific association checks
    if (
      ["Zila Pradhan", "Zila Mantri", "Sangathan Mantri", "Cashier"].includes(role) &&
      !zila
    ) {
      return res.render("saadhak/edit", {
        error: "❌ Zila selection is required for Zila-level roles.",
        saadhak: formData,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find({ zila }),
        kenders: await Kender.find({ ksheter }),
        allowedRoles,
        user,
      });
    }

    if (
      ["Ksheter Pradhan", "Ksheter Mantri"].includes(role) &&
      (!zila || !ksheter)
    ) {
      return res.render("saadhak/edit", {
        error: "❌ Zila and Ksheter must be selected for Ksheter-level roles.",
        saadhak: formData,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find({ zila }),
        kenders: await Kender.find({ ksheter }),
        allowedRoles,
        user,
      });
    }

    if (
      ["Kender Pramukh", "Seh Kender Pramukh", "Shikshak", "Karyakarta", "Saadhak"].includes(role) &&
      (!zila || !ksheter || !kender)
    ) {
      return res.render("saadhak/edit", {
        error: "❌ Zila, Ksheter, and Kender must be selected for Kender-level roles.",
        saadhak: formData,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find({ zila }),
        kenders: await Kender.find({ ksheter }),
        allowedRoles,
        user,
      });
    }

    // Update
    await Saadhak.findByIdAndUpdate(saadhakId, {
      name: formatName(name.trim()),
      mobile,
      dob,
      gender,
      maritalStatus,
      marriageDate: maritalStatus === "Married" ? marriageDate : undefined,
      address,
      livingArea,
      role,
      zila: zila || undefined,
      ksheter: ksheter || undefined,
      kender: kender || undefined,
    });

    res.redirect("/saadhak/manage");
  } catch (err) {
    console.error("❌ Error updating Saadhak:", err);
    res.status(500).send("Server Error");
  }
};

// ✅ Handle Delete
exports.deleteSaadhak = async (req, res) => {
  try {
    await Saadhak.findByIdAndDelete(req.params.id);
    res.redirect("/saadhak/manage");
  } catch (err) {
    console.error("❌ Error deleting Saadhak:", err);
    res.status(500).send("Delete Failed");
  }
};
