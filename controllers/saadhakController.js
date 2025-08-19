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
    allowedRoles = [
      ...ksheterRoles,
      ...kenderRoles,
      ...kenderTeamRoles,
      ...saadhakRoles,
    ];
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
      gender,
      maritalStatus,
      address,
      livingArea,
      role,
      prant,
      zila,
      ksheter,
      kender,
    } = req.body;

    let { dob, dom } = req.body;

    const formData = {
      name,
      mobile,
      dob,
      gender,
      maritalStatus,
      dom,
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
      allowedRoles = [
        ...ksheterRoles,
        ...kenderRoles,
        ...kenderTeamRoles,
        ...saadhakRoles,
      ];
    } else if (user.roles.some((r) => ksheterRoles.includes(r))) {
      allowedRoles = [...kenderRoles, ...kenderTeamRoles, ...saadhakRoles];
    } else if (user.roles.some((r) => kenderRoles.includes(r))) {
      allowedRoles = [...kenderTeamRoles, ...saadhakRoles];
    } else {
      allowedRoles = ["Saadhak"];
    }

    // Validate fields
    if (!validateName(name)) {
      return await renderWithError(
        "❌ Name should contain only alphabets and spaces"
      );
    }

    if (!validateMobile(mobile)) {
      return await renderWithError("❌ Invalid Mobile Number");
    }

    if (!name || !mobile || !role) {
      return await renderWithError("❌ Name, Mobile, and Role are required.");
    }

    if (dob) {
      const [day, month, year] = dob.split("/");
      dob = new Date(
        `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      );
    }

    if (dob && !validateDOB(dob)) {
      return await renderWithError("❌ Invalid Date of Birth");
    }

    if (dom) {
      const [day, month, year] = dom.split("/");
      dom = new Date(
        `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      );
    }
    
    if (dom && maritalStatus === "Married" && !validateDOB(dom)) {
      return await renderWithError("❌ Invalid Marriage Date");
    }

    const existing = await Saadhak.findOne({ mobile });
    if (existing) {
      return await renderWithError("❌ Mobile number already registered.");
    }

    // Hierarchical association validation
    if (prantRoles.includes(role) && !prant) {
      return await renderWithError(
        "❌ Prant selection is required for Prant-level roles."
      );
    }

    if (zilaRoles.includes(role) && (!zila || !prant)) {
      return await renderWithError(
        "❌ Prant & Zila selection is required for Zila-level roles."
      );
    }

    if (ksheterRoles.includes(role) && (!prant || !zila || !ksheter)) {
      return await renderWithError(
        "❌ Prant, Zila and Ksheter must be selected for Ksheter-level roles."
      );
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
      marriageDate: maritalStatus === "Married" ? dom : undefined,
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

    console.log(saadhaks.length);

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

// ✅ Show Edit Form (Updated with unified role logic)
exports.showEditForm = async (req, res) => {
  try {
    const user = req.session.user;
    const saadhak = await Saadhak.findById(req.params.id);
    
    if (user.id == saadhak._id) {
      return res.render("error/unauthorized");
    }

    // Determine allowedRoles based on user's highest role
    let allowedRoles = [];

    if (user.roles.some((role) => adminRoles.includes(role))) {
      allowedRoles = ALL_ROLES;
    } else if (user.roles.some((role) => prantRoles.includes(role))) {
      allowedRoles = ALL_ROLES.filter(
        (role) => ![...adminRoles, ...prantRoles].includes(role)
      );
    } else if (user.roles.some((role) => zilaRoles.includes(role))) {
      allowedRoles = [
        ...ksheterRoles,
        ...kenderRoles,
        ...kenderTeamRoles,
        ...saadhakRoles,
      ];
    } else if (user.roles.some((role) => ksheterRoles.includes(role))) {
      allowedRoles = [...kenderRoles, ...kenderTeamRoles, ...saadhakRoles];
    } else if (user.roles.some((role) => kenderRoles.includes(role))) {
      allowedRoles = [...kenderTeamRoles, ...saadhakRoles];
    } else {
      allowedRoles = ["Saadhak"];
    }

    // Fetch dropdowns based on user's level
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
      zilas = await Zila.find().sort({ name: 1 });
      ksheters = await Ksheter.find().sort({ name: 1 });
      kenders = await Kender.find().sort({ name: 1 });
    } else if (user.roles.some((role) => prantRoles.includes(role))) {
      prants = await Prant.find({ _id: prantId });
      zilas = await Zila.find({ prant: prantId }).sort({ name: 1 });
      ksheters = await Ksheter.find({ prant: prantId }).sort({ name: 1 });
      kenders = await Kender.find({ prant: prantId }).sort({ name: 1 });
    } else if (user.roles.some((role) => zilaRoles.includes(role))) {
      prants = await Prant.find({ _id: prantId });
      zilas = await Zila.find({ _id: zilaId }).sort({ name: 1 });
      ksheters = await Ksheter.find({ zila: zilaId }).sort({ name: 1 });
      kenders = await Kender.find({ zila: zilaId }).sort({ name: 1 });
    } else if (user.roles.some((role) => ksheterRoles.includes(role))) {
      prants = await Prant.find({ _id: prantId });
      zilas = await Zila.find({ _id: zilaId }).sort({ name: 1 });
      ksheters = await Ksheter.find({ _id: ksheterId }).sort({ name: 1 });
      kenders = await Kender.find({ ksheter: ksheterId }).sort({ name: 1 });
    } else if (user.roles.some((role) => kenderRoles.includes(role))) {
      prants = await Prant.find({ _id: prantId });
      zilas = await Zila.find({ _id: zilaId }).sort({ name: 1 });
      ksheters = await Ksheter.find({ _id: ksheterId }).sort({ name: 1 });
      kenders = await Kender.find({ _id: kenderId }).sort({ name: 1 });
    }

    res.render("saadhak/edit", {
      roleConfig,
      saadhak,
      prants,
      zilas,
      ksheters,
      kenders,
      allowedRoles,
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

    const {
      adminRoles,
      prantRoles,
      zilaRoles,
      ksheterRoles,
      kenderRoles,
      kenderTeamRoles,
      saadhakRoles,
    } = require("../config/roles");

    const ALL_ROLES = [
      ...adminRoles,
      ...prantRoles,
      ...zilaRoles,
      ...ksheterRoles,
      ...kenderRoles,
      ...kenderTeamRoles,
      ...saadhakRoles,
    ];

    // ✅ Determine allowed roles based on user's highest role
    let allowedRoles = [];
    if (user.roles.some((r) => adminRoles.includes(r))) {
      allowedRoles = ALL_ROLES;
    } else if (user.roles.some((r) => prantRoles.includes(r))) {
      allowedRoles = ALL_ROLES.filter(
        (r) => ![...adminRoles, ...prantRoles].includes(r)
      );
    } else if (user.roles.some((r) => zilaRoles.includes(r))) {
      allowedRoles = [
        ...ksheterRoles,
        ...kenderRoles,
        ...kenderTeamRoles,
        ...saadhakRoles,
      ];
    } else if (user.roles.some((r) => ksheterRoles.includes(r))) {
      allowedRoles = [...kenderRoles, ...kenderTeamRoles, ...saadhakRoles];
    } else if (user.roles.some((r) => kenderRoles.includes(r))) {
      allowedRoles = [...kenderTeamRoles, ...saadhakRoles];
    } else {
      allowedRoles = ["Saadhak"];
    }

    // ✅ Validations
    if (!validateName(name)) {
      return await renderEdit(
        "❌ Name should contain only alphabets and spaces"
      );
    }

    if (!validateMobile(mobile)) {
      return await renderEdit("❌ Invalid Mobile Number");
    }

    const existing = await Saadhak.findOne({ mobile });
    if (existing && existing._id.toString() !== saadhakId) {
      return await renderEdit(
        "❌ Mobile number already registered with another Saadhak."
      );
    }

    if (!name || !mobile || !role) {
      return await renderEdit("❌ Name, Mobile, and Role are required.");
    }

    if (dob && !validateDOB(dob)) {
      return await renderEdit("❌ Invalid Date of Birth");
    }

    if (
      marriageDate &&
      maritalStatus === "Married" &&
      !validateDOB(marriageDate)
    ) {
      return await renderEdit("❌ Invalid Marriage Date");
    }

    // ✅ Association validations
    if (prantRoles.includes(role) && !prant) {
      return await renderEdit(
        "❌ Prant selection is required for Prant-level roles."
      );
    }

    if (zilaRoles.includes(role) && (!zila || !prant)) {
      return await renderEdit(
        "❌ Prant & Zila selection is required for Zila-level roles."
      );
    }

    if (ksheterRoles.includes(role) && (!prant || !zila || !ksheter)) {
      return await renderEdit(
        "❌ Prant, Zila and Ksheter must be selected for Ksheter-level roles."
      );
    }

    if (
      [...kenderRoles, ...kenderTeamRoles, ...saadhakRoles].includes(role) &&
      (!prant || !zila || !ksheter || !kender)
    ) {
      return await renderEdit(
        "❌ Prant, Zila, Ksheter, and Kender must be selected for Kender, Shikshak, Karyakarta & Saadhak level roles."
      );
    }

    // ✅ Hierarchy clean-up based on role
    let updatedPrant =
      prant && prant !== ""
        ? prant
        : user?.prant?.$oid || user?.prant || undefined;
    let updatedZila = zila && zila !== "" ? zila : undefined;
    let updatedKsheter = ksheter && ksheter !== "" ? ksheter : undefined;
    let updatedKender = kender && kender !== "" ? kender : undefined;

    if (zilaRoles.includes(role)) {
      updatedKsheter = undefined;
      updatedKender = undefined;
    } else if (ksheterRoles.includes(role)) {
      updatedKender = undefined;
    }

    // ✅ Final DB Update
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
      prant: updatedPrant,
      zila: updatedZila,
      ksheter: updatedKsheter,
      kender: updatedKender,
    });

    return res.redirect("/saadhak/manage");

    // ---------- Helper: render form with error ----------
    async function renderEdit(error) {
      const prants = await Prant.find();
      const zilas = await Zila.find();
      const ksheters = await Ksheter.find({ zila });
      const kenders = await Kender.find({ ksheter });

      return res.render("saadhak/edit", {
        error,
        saadhak: formData,
        zilas,
        ksheters,
        kenders,
        prants,
        allowedRoles,
        user,
      });
    }
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

// controllers/saadhakController.js

// Show the self-update form
exports.getSelfUpdateForm = async (req, res) => {
  try {
    const saadhak = await Saadhak.findById(req.session.user.id)
      .populate('prant zila ksheter kender');

    // Process DOB
    if (saadhak?.dob) {
      const dobDate = new Date(saadhak.dob);
      saadhak.dob_day = dobDate.getDate();
      saadhak.dob_month = dobDate.getMonth() + 1; // month is 0-based
      saadhak.dob_year = dobDate.getFullYear();
    }

    // Process DOM (marriage date)
    if (saadhak?.marriageDate) { // make sure your schema field is named "dom"
      const domDate = new Date(saadhak.marriageDate);
      saadhak.dom_day = domDate.getDate();
      saadhak.dom_month = domDate.getMonth() + 1;
      saadhak.dom_year = domDate.getFullYear();
    }

    res.render('saadhak/self-update', {
      saadhak,
      months: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"],
      currentYear: new Date().getFullYear(),
      success: req.query.success,
      error: req.query.error
    });

  } catch (err) {
    console.error(err);
    res.redirect('/?error=Unable to load update form');
  }
};


// Handle the update
exports.postSelfUpdate = async (req, res) => {
  try {
    // Build DOB from parts
    let dob = null;
    if (req.body.dob_day && req.body.dob_month && req.body.dob_year) {
      dob = new Date(
        req.body.dob_year,
        req.body.dob_month - 1, // month is zero-based
        req.body.dob_day
      );
    }

    // Build marriageDate from parts
    let marriageDate = null;
    if (req.body.dom_day && req.body.dom_month && req.body.dom_year) {
      marriageDate = new Date(
        req.body.dom_year,
        req.body.dom_month - 1,
        req.body.dom_day
      );
    }

    const updateData = {
      name: req.body.name,
      dob,
      gender: req.body.gender,
      maritalStatus: req.body.maritalStatus,
      marriageDate,
      address: req.body.address,
      livingArea: req.body.livingArea
    };

    await Saadhak.findByIdAndUpdate(req.session.user.id, updateData);

    res.redirect('/saadhak/self-update?success=Details updated successfully');
  } catch (err) {
    console.error(err);
    res.redirect('/saadhak/self-update?error=Unable to update details');
  }
};

