const Saadhak = require("../models/Saadhak");
const Prant = require("../models/Prant");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const roleConfig = require("../config/roles");
const { cloudinary } = require("../utils/cloudinary");

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
      email,
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

    let { doj, dob, dom } = req.body;

    const formData = {
      name,
      mobile,
      email,
      doj,
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

    if (doj) {
      const [day, month, year] = doj.split("/");
      doj = new Date(
        `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      );
    }

    if (doj && !validateDOB(doj)) {
      return await renderWithError("❌ Invalid Date of Birth");
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

    const trimmedEmail = email?.trim().toLowerCase();

    if (trimmedEmail) {
      const existingEmail = await Saadhak.findOne({ email: trimmedEmail });
      if (existingEmail) {
        return await renderWithError("❌ Email address already registered.");
      }
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

    console.log(typeof prant);
    console.log(prant);

    // Determine prantId cleanly
    const prantId = prant?.trim() || user?.prant?.$oid || user?.prant;
    if (!prantId) {
      return await renderWithError("❌ Prant association is missing.");
    }

    // Save Saadhak
    const saadhak = new Saadhak({
      name: formatName(name.trim()),
      mobile,
      doj,
      email: email?.trim().toLowerCase(),
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
    const userRoles = Array.isArray(user.roles) ? user.roles : [user.roles]; // ✅ Always treat roles as array

    // Helper function for role checks
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
      // ✅ Admin gets full access — skip restrictions

      // ✅ Apply Prant-level restrictions (for Prant team)
      if (hasRole(prantRoles)) {
        query.prant = user.prant?.$oid || user.prant;
      }

      // ✅ Apply Zila-level restrictions
      if (hasRole(zilaRoles)) {
        query.prant = user.prant?.$oid || user.prant;
        query.zila = user.zila?.$oid || user.zila;
      }

      // ✅ Apply Ksheter-level restrictions
      if (hasRole(ksheterRoles)) {
        query.prant = user.prant?.$oid || user.prant;
        query.zila = user.zila?.$oid || user.zila;
        query.ksheter = user.ksheter?.$oid || user.ksheter;
      }

      // ✅ Apply Kender-level restrictions
      if (hasRole(kenderRoles) || hasRole(kenderTeamRoles)) {
        query.prant = user.prant?.$oid || user.prant;
        query.zila = user.zila?.$oid || user.zila;
        query.ksheter = user.ksheter?.$oid || user.ksheter;
        query.kender = user.kender?.$oid || user.kender;
      }
    }

    // ✅ Fetch data as before
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

    // Process DOB
    if (saadhak?.dob) {
      const dobDate = new Date(saadhak.dob);
      saadhak.dob_day = dobDate.getDate();
      saadhak.dob_month = dobDate.getMonth() + 1; // month is 0-based
      saadhak.dob_year = dobDate.getFullYear();
    }

    // Process DOM (marriage date)
    if (saadhak?.marriageDate) {
      const domDate = new Date(saadhak.marriageDate);
      saadhak.dom_day = domDate.getDate();
      saadhak.dom_month = domDate.getMonth() + 1;
      saadhak.dom_year = domDate.getFullYear();
    }

    // Process DOJ (date of joining)
    if (saadhak?.doj) {
      const dojDate = new Date(saadhak.doj);
      saadhak.doj_day = dojDate.getDate();
      saadhak.doj_month = dojDate.getMonth() + 1;
      saadhak.doj_year = dojDate.getFullYear();
    }

    res.render("saadhak/edit", {
      roleConfig,
      saadhak,
      months: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      currentYear: new Date().getFullYear(),
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
    let {
      name,
      mobile,
      email,
      doj,
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
      email,
      doj,
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

    // Build DOB from parts
    dob = null;
    if (req.body.dob_day && req.body.dob_month && req.body.dob_year) {
      dob = new Date(
        req.body.dob_year,
        req.body.dob_month - 1, // month is zero-based
        req.body.dob_day
      );
    }

    // Build marriageDate from parts
    marriageDate = null;
    if (req.body.dom_day && req.body.dom_month && req.body.dom_year) {
      marriageDate = new Date(
        req.body.dom_year,
        req.body.dom_month - 1,
        req.body.dom_day
      );
    }

    // Build doj (Date of Joining) from parts
    doj = null;
    if (req.body.doj_day && req.body.doj_month && req.body.doj_year) {
      doj = new Date(
        req.body.doj_year,
        req.body.doj_month - 1,
        req.body.doj_day
      );
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

    const normalizedEmail = email?.trim().toLowerCase();

    if (normalizedEmail) {
      const existingEmail = await Saadhak.findOne({ email: normalizedEmail });
      if (existingEmail && existingEmail._id.toString() !== saadhakId) {
        return await renderEdit(
          "❌ Email address already registered with another Saadhak."
        );
      }
    }

    if (!name || !mobile || !role) {
      return await renderEdit("❌ Name, Mobile, and Role are required.");
    }

    if (doj && typeof doj === "string") {
      const [day, month, year] = doj.split("/");
      doj = new Date(
        `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      );
    }

    if (doj && !validateDOB(doj)) {
      return await renderEdit("❌ Invalid Date of Joining");
    }

    if (dob && typeof dob === "string") {
      const [day, month, year] = dob.split("/");
      dob = new Date(
        `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      );
    }

    if (dob && !validateDOB(dob)) {
      return await renderEdit("❌ Invalid Date of Birth");
    }

    if (marriageDate && typeof marriageDate === "string") {
      const [day, month, year] = marriageDate.split("/");
      marriageDate = new Date(
        `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
      );
    }

    if (
      marriageDate &&
      maritalStatus === "Married" &&
      !validateDOB(marriageDate)
    ) {
      return await renderEdit("❌ Invalid Marriage Date");
    }

    // ✅ Association validations
    if (
      Array.isArray(role) &&
      role.some((r) => prantRoles.includes(r)) &&
      !prant
    ) {
      return await renderEdit(
        "❌ Prant selection is required for Prant-level roles."
      );
    }

    if (
      Array.isArray(role) &&
      role.some((r) => zilaRoles.includes(r)) &&
      (!zila || !prant)
    ) {
      return await renderEdit(
        "❌ Prant & Zila selection is required for Zila-level roles."
      );
    }

    if (
      Array.isArray(role) &&
      role.some((r) => ksheterRoles.includes(r)) &&
      (!prant || !zila || !ksheter)
    ) {
      return await renderEdit(
        "❌ Prant, Zila and Ksheter must be selected for Ksheter-level roles."
      );
    }

    if (
      Array.isArray(role) &&
      role.some((r) =>
        [...kenderRoles, ...kenderTeamRoles, ...saadhakRoles].includes(r)
      ) &&
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

    // ✅ Ensure role is always an array
    if (!Array.isArray(role)) {
      role = [role];
    }

    // ✅ Hierarchy Logic
    if (role.some((r) => zilaRoles.includes(r))) {
      updatedZila = updatedZila; // keep zila if needed
      updatedKsheter = undefined;
      updatedKender = undefined;
    } else if (role.some((r) => ksheterRoles.includes(r))) {
      updatedKender = undefined;
    }

    // ✅ Prepare Update Object
    const updateData = {
      name: formatName(name.trim()),
      mobile,
      doj,
      email: normalizedEmail,
      dob,
      gender,
      maritalStatus,
      marriageDate: maritalStatus === "Married" ? marriageDate : undefined,
      address,
      livingArea,
      role,
      prant: updatedPrant,
    };

    // ✅ Handle Zila / Ksheter / Kender hierarchy unsets
    if (updatedZila !== undefined) updateData.zila = updatedZila;
    else updateData.$unset = { ...(updateData.$unset || {}), zila: "" };

    if (updatedKsheter !== undefined) updateData.ksheter = updatedKsheter;
    else updateData.$unset = { ...(updateData.$unset || {}), ksheter: "" };

    if (updatedKender !== undefined) updateData.kender = updatedKender;
    else updateData.$unset = { ...(updateData.$unset || {}), kender: "" };

    // ✅ Final DB Update
    await Saadhak.findByIdAndUpdate(saadhakId, updateData);

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

// controllers/saadhakController.js

exports.deleteSaadhak = async (req, res) => {
  try {
    const user = req.session.user;

    if (user.id == req.params.id) {
      return res.render("error/unauthorized");
    }

    // First find the Saadhak
    const saadhak = await Saadhak.findById(req.params.id);
    if (!saadhak) {
      return res.status(404).send("Saadhak not found");
    }

    // Delete Cloudinary image if exists
    if (saadhak.photoPublicId) {
      try {
        await cloudinary.uploader.destroy(saadhak.photoPublicId, {
          resource_type: "image",
        });
      } catch (e) {
        console.error(
          "Failed to delete Cloudinary image on saadhak removal:",
          e
        );
      }
    }

    // Now delete from DB
    await Saadhak.findByIdAndDelete(req.params.id);

    res.redirect("/saadhak/manage");
  } catch (err) {
    console.error("❌ Error deleting Saadhak:", err);
    res.status(500).send("Delete Failed");
  }
};

// GET: Show self-update form
exports.getSelfUpdateForm = async (req, res) => {
  try {
    const saadhak = await Saadhak.findById(req.session.user.id).populate(
      "prant zila ksheter kender"
    );

    // Process DOB
    if (saadhak?.dob) {
      const dobDate = new Date(saadhak.dob);
      saadhak.dob_day = dobDate.getDate();
      saadhak.dob_month = dobDate.getMonth() + 1;
      saadhak.dob_year = dobDate.getFullYear();
    }

    // Process DOM (marriage date)
    if (saadhak?.marriageDate) {
      const domDate = new Date(saadhak.marriageDate);
      saadhak.dom_day = domDate.getDate();
      saadhak.dom_month = domDate.getMonth() + 1;
      saadhak.dom_year = domDate.getFullYear();
    }

    // Process DOJ (date of joining)
    if (saadhak?.doj) {
      const dojDate = new Date(saadhak.doj);
      saadhak.doj_day = dojDate.getDate();
      saadhak.doj_month = dojDate.getMonth() + 1;
      saadhak.doj_year = dojDate.getFullYear();
    }

    // 🔹 Fitness defaults
    saadhak.weightKg = saadhak.weightKg || "";
    saadhak.heightFeet = saadhak.heightFeet || "";
    saadhak.heightInches = saadhak.heightInches || "";

    res.render("saadhak/self-update", {
      saadhak,
      months: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      currentYear: new Date().getFullYear(),
      success: req.query.success,
      error: req.query.error,
    });
  } catch (err) {
    console.error(err);
    res.redirect("/?error=Unable to load update form");
  }
};

// POST: Handle self-update form submission
exports.postSelfUpdate = async (req, res) => {
  try {
    // Build DOB from parts
    let dob = null;
    if (req.body.dob_day && req.body.dob_month && req.body.dob_year) {
      dob = new Date(
        req.body.dob_year,
        req.body.dob_month - 1,
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

    // Build DOJ (Date of Joining) from parts
    let doj = null;
    if (req.body.doj_day && req.body.doj_month && req.body.doj_year) {
      doj = new Date(
        req.body.doj_year,
        req.body.doj_month - 1,
        req.body.doj_day
      );
    }

    const updateData = {
      name: req.body.name,
      dob,
      gender: req.body.gender,
      maritalStatus: req.body.maritalStatus,
      marriageDate,
      address: req.body.address,
      livingArea: req.body.livingArea,
      doj,
      email: req.body.email,

      // Fitness fields
      weightKg: req.body.weightKg ? parseFloat(req.body.weightKg) : undefined,
      heightFeet: req.body.heightFeet
        ? parseInt(req.body.heightFeet)
        : undefined,
      heightInches: req.body.heightInches
        ? parseInt(req.body.heightInches)
        : undefined,
    };

    await Saadhak.findByIdAndUpdate(req.session.user.id, updateData);

    res.redirect("/saadhak/self-update?success=Details updated successfully");
  } catch (err) {
    console.error(err);
    res.redirect("/saadhak/self-update?error=Unable to update details");
  }
};

// const { cloudinary } = require('../utils/cloudinary');

exports.uploadPhotoAjax = async (req, res) => {
  try {
    const saadhakId = req.params.id;

    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No file uploaded" });
    }

    // New file info from multer-storage-cloudinary
    const newUrl = req.file.path; // full secure URL
    const newPublicId = req.file.filename; // public_id (e.g. "saadhak_photos/abc123")

    // Find existing Saadhak
    const saadhak = await Saadhak.findById(saadhakId);
    if (!saadhak) {
      // Optional: cleanup newly uploaded image because no saadhak exists
      try {
        await cloudinary.uploader.destroy(newPublicId, {
          resource_type: "image",
        });
      } catch (e) {
        console.warn("cleanup failed", e);
      }
      return res
        .status(404)
        .json({ success: false, message: "Saadhak not found" });
    }

    // If there's an existing photoPublicId and it's different from newly uploaded one -> delete it
    if (saadhak.photoPublicId && saadhak.photoPublicId !== newPublicId) {
      try {
        await cloudinary.uploader.destroy(saadhak.photoPublicId, {
          resource_type: "image",
        });
        // optionally log: console.log("Deleted old Cloudinary image:", saadhak.photoPublicId);
      } catch (delErr) {
        // Don't fail the whole request if delete fails — log and continue
        console.error(
          "Failed to delete old Cloudinary image:",
          saadhak.photoPublicId,
          delErr
        );
      }
    }

    // Save new info to DB
    saadhak.photoUrl = newUrl;
    saadhak.photoPublicId = newPublicId;
    await saadhak.save();

    req.session.user.photoUrl = saadhak.photoUrl;
    req.session.user.photoPublicId = saadhak.photoPublicId;

    return res.json({
      success: true,
      message: "Photo uploaded and previous image (if any) removed",
      photoUrl: saadhak.photoUrl,
      photoPublicId: saadhak.photoPublicId,
    });
  } catch (err) {
    console.error("uploadPhotoAjax error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

exports.downloadKenderIdcards = async (req, res) => {
  try {
    const kenderId = req.params.id;

    // ---------------------------
    // 1️⃣ Fetch Kender → Ksheter → Zila → Prant
    // ---------------------------
    const kenderData = await Kender.findById(kenderId)
      .populate({
        path: "ksheter",
        populate: {
          path: "zila",
          populate: {
            path: "prant"
          }
        }
      })
      .lean();

    if (!kenderData) {
      return res.send("Kender not found");
    }

    const ksheterName = kenderData.ksheter?.name || "";
    const zilaName = kenderData.ksheter?.zila?.name || "";
    const prantName = kenderData.ksheter?.zila?.prant?.name || "";

    // ---------------------------
    // 2️⃣ Fetch all users of this Kender
    // ---------------------------
    const users = await Saadhak.find({ kender: kenderId })
      .populate("kender", "name")
      .populate("ksheter", "name")
      .sort({ name: 1 })
      .lean();

    // ---------------------------
    // 3️⃣ Attach names for EJS
    // ---------------------------
    const usersWithNames = users.map(u => ({
      ...u,
      kenderName: u.kender?.name || "",
      ksheterName: ksheterName,
      zilaName: zilaName,
      prantName: prantName
    }));

    // ---------------------------
    // 4️⃣ Render EJS
    // ---------------------------
    res.render("idcard/multiple", { users: usersWithNames });

  } catch (err) {
    console.error(err);
    res.send("Error generating ID cards");
  }
};


