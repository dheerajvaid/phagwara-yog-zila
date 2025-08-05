const Saadhak = require("../models/Saadhak");
const Prant = require("../models/Prant");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const roleConfig = require("../config/roles");

const {
  validateMobile,
  validateName,
  validateDOB,
} = require("../utils/validators");

const { formatName } = require("../utils/formatters");

const {
  adminRoles,
  prantRoles,
  zilaRoles,
  ksheterRoles,
  kenderRoles,
  kenderTeamRoles,
  saadhakRoles,
} = roleConfig;

const ALL_ROLES = [
  ...adminRoles,
  ...prantRoles,
  ...zilaRoles,
  ...ksheterRoles,
  ...kenderRoles,
  ...kenderTeamRoles,
  ...saadhakRoles,
];

exports.showAddForm = async (req, res) => {
  const user = req.session.user;
  let allowedRoles = [];

  // Determine allowedRoles based on user's highest role
  if (user.roles.some((role) => adminRoles.includes(role))) {
    allowedRoles = ALL_ROLES;
  } else if (user.roles.some((role) => prantRoles.includes(role))) {
    allowedRoles = ALL_ROLES.filter(
      (role) => ![...adminRoles, ...prantRoles].includes(role)
    );
  } else if (user.roles.some((role) => zilaRoles.includes(role))) {
    allowedRoles = [...ksheterRoles, ...kenderRoles, ...kenderTeamRoles, ...saadhakRoles];
  } else if (user.roles.some((role) => ksheterRoles.includes(role))) {
    allowedRoles = [...kenderRoles, ...kenderTeamRoles, ...saadhakRoles];
  } else if (user.roles.some((role) => kenderRoles.includes(role))) {
    allowedRoles = [...kenderTeamRoles, ...saadhakRoles];
  }

  // Fetch dropdown values based on user level
  let prants = [];
  let zilas = [];
  let ksheters = [];
  let kenders = [];

 
 const prantId = user.prant?.$oid || user.prant;
const zilaId = user.zila?.$oid || user.zila;
const ksheterId = user.ksheter?.$oid || user.ksheter;
const kenderId = user.kender?.$oid || user.kender;

if (user.roles.some((role) => adminRoles.includes(role))) {
  prants = await Prant.find();
  zilas = await Zila.find();
  ksheters = await Ksheter.find();
  kenders = await Kender.find();
} else if (user.roles.some((role) => prantRoles.includes(role))) {
  prants = await Prant.find({ _id: prantId });
  zilas = await Zila.find({ prant: prantId });
  ksheters = await Ksheter.find({ prant: prantId });
  kenders = await Kender.find({ prant: prantId });
} else if (user.roles.some((role) => zilaRoles.includes(role))) {
  prants = await Prant.find({ _id: prantId });
  zilas = await Zila.find({ _id: zilaId });
  ksheters = await Ksheter.find({ zila: zilaId });
  kenders = await Kender.find({ zila: zilaId });
} else if (user.roles.some((role) => ksheterRoles.includes(role))) {
  prants = await Prant.find({ _id: prantId });
  zilas = await Zila.find({ _id: zilaId });
  ksheters = await Ksheter.find({ _id: ksheterId });
  kenders = await Kender.find({ ksheter: ksheterId });
} else if (user.roles.some((role) => kenderRoles.includes(role))) {
  prants = await Prant.find({ _id: prantId });
  zilas = await Zila.find({ _id: zilaId });
  ksheters = await Ksheter.find({ _id: ksheterId });
  kenders = await Kender.find({ _id: kenderId });
}


  res.render("saadhak/add", {
    roleConfig,
    prants,
    zilas,
    ksheters,
    kenders,
    allowedRoles,
    formData: {},
    error: null,
    success: null,
    user,
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
      prant,
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
      prant,
      zila,
      ksheter,
      kender,
    };

    const user = req.session.user;

    // Role-based permissions using roleConfig
    let allowedRoles = [];
    if (user.roles.some((r) => adminRoles.includes(r))) {
      allowedRoles = ALL_ROLES;
    } else if (user.roles.some((r) => prantRoles.includes(r))) {
      allowedRoles = ALL_ROLES.filter(
        (r) => ![...adminRoles, ...prantRoles].includes(r)
      );
    } else if (user.roles.some((r) => zilaRoles.includes(r))) {
      allowedRoles = [...ksheterRoles, ...kenderRoles, ...kenderTeamRoles, ...saadhakRoles];
    } else if (user.roles.some((r) => ksheterRoles.includes(r))) {
      allowedRoles = [...kenderRoles, ...kenderTeamRoles, ...saadhakRoles];
    } else if (user.roles.some((r) => kenderRoles.includes(r))) {
      allowedRoles = [...kenderTeamRoles, ...saadhakRoles];
    } else {
      allowedRoles = ["Saadhak"];
    }

    // Validate fields
    if (!validateName(name)) {
      return await renderWithError("❌ Name should contain only alphabets and spaces");
    }

    if (!validateMobile(mobile)) {
      return await renderWithError("❌ Invalid Mobile Number");
    }

    if (!name || !mobile || !role) {
      return await renderWithError("❌ Name, Mobile, and Role are required.");
    }

    if (dob && !validateDOB(dob)) {
      return await renderWithError("❌ Invalid Date of Birth");
    }

    if (marriageDate && maritalStatus === "Married" && !validateDOB(marriageDate)) {
      return await renderWithError("❌ Invalid Marriage Date");
    }

    const existing = await Saadhak.findOne({ mobile });
    if (existing) {
      return await renderWithError("❌ Mobile number already registered.");
    }

    // Hierarchical association validation
    if (prantRoles.includes(role) && !prant) {
      return await renderWithError("❌ Prant selection is required for Prant-level roles.");
    }

    if (zilaRoles.includes(role) && (!zila || !prant)) {
      return await renderWithError("❌ Prant & Zila selection is required for Zila-level roles.");
    }

    if (ksheterRoles.includes(role) && (!prant || !zila || !ksheter)) {
      return await renderWithError("❌ Prant, Zila and Ksheter must be selected for Ksheter-level roles.");
    }

    if (
      [...kenderRoles, ...kenderTeamRoles, ...saadhakRoles].includes(role) &&
      (!prant || !zila || !ksheter || !kender)
    ) {
      return await renderWithError(
        "❌ Prant, Zila, Ksheter, and Kender must be selected for Kender, Shikshak, Karyakarta & Saadhak level roles."
      );
    }

    // Determine prantId cleanly
    const prantId = prant?.trim() || user?.prant?.$oid || user?.prant;
    if (!prantId) {
      return await renderWithError("❌ Prant association is missing.");
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
      prant: prantId,
      zila: zila || undefined,
      ksheter: ksheter || undefined,
      kender: kender || undefined,
    });

    await saadhak.save();

    const [zilas, ksheters, kenders, prants] = await loadDropdownData();

    return res.render("saadhak/add", {
      success: "✅ Saadhak added successfully!",
      roleConfig,
      zilas,
      ksheters,
      kenders,
      prants,
      allowedRoles,
      formData: {},
      error: null,
      user: req.session.user,
    });

    // ---------- Helpers ----------
    async function renderWithError(errorMessage) {
      const [zilas, ksheters, kenders, prants] = await loadDropdownData();
      return res.render("saadhak/add", {
        success: null,
        error: errorMessage,
        roleConfig,
        zilas,
        ksheters,
        kenders,
        prants,
        allowedRoles,
        formData,
        user: req.session.user,
      });
    }

    async function loadDropdownData() {
      return Promise.all([
        Zila.find(),
        Ksheter.find(),
        Kender.find(),
        Prant.find(),
      ]);
    }

  } catch (err) {
    console.error("❌ Error creating Saadhak:", err);
    res.status(500).send("Server Error");
  }
};


exports.listSaadhaks = async (req, res) => {
  try {
    const user = req.session.user;

    const query = {};
    const userRoles = user.roles;

    const hasRole = (roleGroup) => userRoles.some((r) => roleGroup.includes(r));

    // If user has no allowed role, show nothing
    if (
      !hasRole([
        ...adminRoles,
        ...prantRoles,
        ...zilaRoles,
        ...ksheterRoles,
        ...kenderRoles,
        ...kenderTeamRoles,
        ...saadhakRoles,
      ])
    ) {
      query._id = null;
    } else if (!userRoles.includes("Admin")) {
      // Admin gets all access — skip restrictions

      // Apply Prant-level restrictions
      if (hasRole(prantRoles)) {
        query.prant = user.prant?.$oid || user.prant;
      }

      // Apply Zila-level restrictions
      if (hasRole(zilaRoles)) {
        query.zila = user.zila?.$oid || user.zila;
      }

      // Apply Ksheter-level restrictions + exclude Ksheter roles
      if (hasRole(ksheterRoles)) {
        query.ksheter = user.ksheter?.$oid || user.ksheter;        
      }

      // Apply Kender-level restrictions + exclude Ksheter and Kender Main Team roles
      if (hasRole(kenderRoles)) {
        query.kender = user.kender?.$oid || user.kender;
      }
    }

    const saadhaks = await Saadhak.find(query)
      .populate("prant")
      .populate("zila")
      .populate("ksheter")
      .populate("kender")
      .sort({ name: 1 });

    const [prants, zilas, ksheters, kenders] = await Promise.all([
      Prant.find().sort({ name: 1 }),
      Zila.find().sort({ name: 1 }),
      Ksheter.find().sort({ name: 1 }),
      Kender.find().sort({ name: 1 }),
    ]);

    res.render("saadhak/list", {
      saadhaks,
      prants,
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

    //console.log(req.session.user);
    const prants = await Prant.find(); // ✅    
    const zilas = await Zila.find().sort({ name: 1 });
    const ksheters = await Ksheter.find({ zila: saadhak.zila }).sort({
      name: 1,
    });
    const kenders = await Kender.find({ ksheter: saadhak.ksheter }).sort({
      name: 1,
    });

    // console.log(kenders);

    // ✅ Determine allowedRoles based on the logged-in user
    let allowedRoles = ["Saadhak"];
    if (user.roles.includes("Admin")) {
      allowedRoles = ALL_ROLES;
    } else if (user.roles.includes("Zila Pradhan")) {
      allowedRoles = ALL_ROLES.filter(
        (role) => !["Admin", "Zila Pradhan"].includes(role)
      );
    } else if (user.roles.includes("Zila Mantri")) {
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

    // console.log(kenders);
    // console.log("------");
    // console.log(saadhak);
    // console.log(zilas);
    // console.log(ksheters);
    // console.log(kenders);
    res.render("saadhak/edit", {
      saadhak,
      prants,
      zilas,
      ksheters,
      kenders,
      allowedRoles, // ✅ Fix: pass this to EJS
      error: null,
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
      prant,
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
      prant,
      zila,
      ksheter,
      kender,
    };

    // Role logic
    let allowedRoles = ["Saadhak"];
    if (user.roles.includes("Admin")) {
      allowedRoles = ALL_ROLES;
    } else if (user.roles.includes("Zila Pradhan")) {
      allowedRoles = ALL_ROLES.filter(
        (r) => !["Admin", "Zila Pradhan"].includes(r)
      );
    } else if (user.roles.includes("Zila Mantri")) {
      allowedRoles = ALL_ROLES.filter(
        (r) => !["Admin", "Zila Pradhan", "Zila Mantri"].includes(r)
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
      ["Zila Pradhan", "Zila Mantri", "Sangathan Mantri", "Cashier"].includes(
        role
      ) &&
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
      [
        "Kender Pramukh",
        "Seh Kender Pramukh",
        "Shikshak",
        "Karyakarta",
        "Saadhak",
      ].includes(role) &&
      (!zila || !ksheter || !kender)
    ) {
      return res.render("saadhak/edit", {
        error:
          "❌ Zila, Ksheter, and Kender must be selected for Kender-level roles.",
        saadhak: formData,
        zilas: await Zila.find(),
        ksheters: await Ksheter.find({ zila }),
        kenders: await Kender.find({ ksheter }),
        allowedRoles,
        user,
      });
    }

    // 🧼 Clean up hierarchy fields based on role level
    let updatedKsheter = ksheter;
    let updatedKender = kender;

    const rolesArray = Array.isArray(role) ? role : [role];
    const lowerRoles = rolesArray.map((r) => r.toLowerCase());

    const isZilaLevel = lowerRoles.some((r) =>
      ["zila pradhan", "zila mantri", "sangathan mantri", "cashier"].includes(r)
    );
    const isKsheterLevel = lowerRoles.some((r) =>
      ["ksheter pradhan", "ksheter mantri"].includes(r)
    );

    if (isZilaLevel) {
      updatedKsheter = null;
      updatedKender = null;
    } else if (isKsheterLevel) {
      updatedKender = null;
    }

    console.log(updatedKsheter);
    console.log(updatedKender);

    // ✅ Final update
    await Saadhak.findByIdAndUpdate(saadhakId, {
      name: formatName(name.trim()),
      mobile,
      dob,
      gender,
      maritalStatus,
      marriageDate: maritalStatus === "Married" ? marriageDate : undefined,
      address,
      livingArea,
      role: rolesArray,
      prant: prant || undefined,
      zila: zila || undefined,
      ksheter: updatedKsheter === null ? null : updatedKsheter,
      kender: updatedKender === null ? null : updatedKender,
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
