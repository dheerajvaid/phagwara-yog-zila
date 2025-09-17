const mongoose = require("mongoose");
const Program = require("../models/Program");
const Prant = require("../models/Prant");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");
const XLSX = require('xlsx');

const {
  adminRoles,
  prantRoles,
  zilaRoles,
  ksheterRoles,
  kenderRoles,
  kenderTeamRoles,
  saadhakRoles,
} = require("../config/roles");

// Show Create Program Form
exports.showCreateForm = async (req, res) => {
  try {
    const user = req.session.user;
    const userRoles = user.roles;

    let prants = [],
      zilas = [],
      ksheters = [],
      kenders = [];
    let allowedLevels = [];

    if (userRoles.some((r) => adminRoles.includes(r))) {
      prants = await Prant.find({ deleted: false }).lean();
      allowedLevels = ["prant", "zila", "ksheter", "kender", "saadhak"];
    } else if (userRoles.some((r) => prantRoles.includes(r))) {
      prants = await Prant.find({ _id: user.prant }).lean();
      zilas = await Zila.find({ prant: user.prant }).lean();
      allowedLevels = ["prant", "zila", "ksheter", "kender", "saadhak"];
    } else if (userRoles.some((r) => zilaRoles.includes(r))) {
      prants = await Prant.find({ _id: user.prant }).lean();
      zilas = await Zila.find({ _id: user.zila }).lean();
      ksheters = await Ksheter.find({ zila: user.zila }).lean();
      allowedLevels = ["zila", "ksheter", "kender", "saadhak"];
    } else if (userRoles.some((r) => ksheterRoles.includes(r))) {
      prants = await Prant.find({ _id: user.prant }).lean();
      zilas = await Zila.find({ _id: user.zila }).lean();
      ksheters = await Ksheter.find({ _id: user.ksheter }).lean();
      kenders = await Kender.find({ ksheter: user.ksheter }).lean();
      allowedLevels = ["ksheter", "kender", "saadhak"];
    } else if (userRoles.some((r) => kenderRoles.includes(r))) {
      prants = await Prant.find({ _id: user.prant }).lean();
      zilas = await Zila.find({ _id: user.zila }).lean();
      ksheters = await Ksheter.find({ _id: user.ksheter }).lean();
      kenders = await Kender.find({ _id: user.kender }).lean();
      allowedLevels = ["kender", "saadhak"];
    }
    // console.log(allowedLevels);

    res.render("programs/create", {
      formAction: "/programs/create",
      buttonText: "Create Program",
      program: {},
      user,
      adminRoles,
      prantRoles,
      zilaRoles,
      ksheterRoles,
      kenderRoles,
      prants,
      zilas,
      ksheters,
      kenders,
      allowedLevels, // <-- Pass allowedLevels to EJS
    });
  } catch (error) {
    console.error("Error loading create form:", error);
    res.status(500).send("Server error");
  }
};

// Create Program - Save form data
exports.createProgram = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user || !user.id) return res.status(401).send("User not logged in");

    const {
      name,
      details,
      startDate,
      endDate,
      startTime,
      endTime,
      venue,
      status,
      allowedPrants = [],
      allowedZilas = [],
      allowedKsheters = [],
      allowedKenders = [],
      allowedLevels = [],
    } = req.body;

    if (
      !name ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime ||
      !venue ||
      !status
    ) {
      return res.status(400).send("Missing required fields");
    }

    // Helper to clean and keep only valid ObjectId strings
    const sanitizeIds = (input) => {
      if (!input) return [];
      if (typeof input === "string") input = [input];
      return input
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id.trim()))
        .map((id) => id.trim());
    };

    const program = new Program({
      title: name,
      description: details,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime,
      endTime,
      venue,
      status,
      organizer: user.id,
      allowedPrants: [
        ...sanitizeIds(allowedPrants),
        ...(user.prant ? [user.prant] : []),
      ],
      allowedZilas: [
        ...sanitizeIds(allowedZilas),
        ...(user.zila ? [user.zila] : []),
      ],
      allowedKsheters: [
        ...sanitizeIds(allowedKsheters),
        ...(user.ksheter ? [user.ksheter] : []),
      ],
      allowedKenders: [
        ...sanitizeIds(allowedKenders),
        ...(user.kender ? [user.kender] : []),
      ],

      allowedLevels: Array.isArray(allowedLevels)
        ? allowedLevels
        : [allowedLevels],
    });

    await program.save();
    res.redirect("/programs");
  } catch (error) {
    console.error("Error creating program:", error);
    res.status(500).send("Server error");
  }
};

// Show Edit Form
exports.showEditForm = async (req, res) => {
  try {
    const programId = req.params.id;
    const user = req.session.user; // use session user like in create
    if (!user) return res.status(401).send("User not logged in");

    const userRoles = user.roles;

    const program = await Program.findById(programId).lean();
    if (!program) return res.status(404).send("Program not found");

    // Fetch scope data like in create form
    let prants = [],
      zilas = [],
      ksheters = [],
      kenders = [];
    let allowedLevels = [];

    if (userRoles.some((r) => adminRoles.includes(r))) {
      prants = await Prant.find({ deleted: false }).lean();
      allowedLevels = ["prant", "zila", "ksheter", "kender", "saadhak"];
    } else if (userRoles.some((r) => prantRoles.includes(r))) {
      prants = await Prant.find({ _id: user.prant }).lean();
      zilas = await Zila.find({ prant: user.prant }).lean();
      allowedLevels = ["prant", "zila", "ksheter", "kender", "saadhak"];
    } else if (userRoles.some((r) => zilaRoles.includes(r))) {
      prants = await Prant.find({ _id: user.prant }).lean();
      zilas = await Zila.find({ _id: user.zila }).lean();
      ksheters = await Ksheter.find({ zila: user.zila }).lean();
      allowedLevels = ["zila", "ksheter", "kender", "saadhak"];
    } else if (userRoles.some((r) => ksheterRoles.includes(r))) {
      prants = await Prant.find({ _id: user.prant }).lean();
      zilas = await Zila.find({ _id: user.zila }).lean();
      ksheters = await Ksheter.find({ _id: user.ksheter }).lean();
      kenders = await Kender.find({ ksheter: user.ksheter }).lean();
      allowedLevels = ["ksheter", "kender", "saadhak"];
    } else if (userRoles.some((r) => kenderRoles.includes(r))) {
      prants = await Prant.find({ _id: user.prant }).lean();
      zilas = await Zila.find({ _id: user.zila }).lean();
      ksheters = await Ksheter.find({ _id: user.ksheter }).lean();
      kenders = await Kender.find({ _id: user.kender }).lean();
      allowedLevels = ["kender", "saadhak"];
    }

    // Convert ObjectId arrays to strings for EJS comparison
    program.allowedPrants =
      program.allowedPrants?.map((id) => id.toString()) || [];
    program.allowedZilas =
      program.allowedZilas?.map((id) => id.toString()) || [];
    program.allowedKsheters =
      program.allowedKsheters?.map((id) => id.toString()) || [];
    program.allowedKenders =
      program.allowedKenders?.map((id) => id.toString()) || [];

    res.render("programs/edit", {
      formAction: "/programs/edit/" + programId,
      buttonText: "Update Program",
      program,
      user,
      adminRoles,
      prantRoles,
      zilaRoles,
      ksheterRoles,
      kenderRoles,
      prants,
      zilas,
      ksheters,
      kenders,
      allowedLevels,
    });
  } catch (error) {
    console.error("Error loading edit form:", error);
    res.status(500).send("Server error");
  }
};

// Update Program
exports.updateProgram = async (req, res) => {
  try {
    const programId = req.params.id;
    const user = req.session.user; // consistent with create
    if (!user) return res.status(401).send("User not logged in");

    const {
      name,
      details,
      startDate,
      endDate,
      startTime,
      endTime,
      venue,
      status,
      allowedPrants = [],
      allowedZilas = [],
      allowedKsheters = [],
      allowedKenders = [],
      allowedLevels = [],
    } = req.body;

    if (
      !name ||
      !startDate ||
      !endDate ||
      !startTime ||
      !endTime ||
      !venue ||
      !status
    ) {
      return res.status(400).send("Missing required fields");
    }

    // Helper to sanitize IDs
    const sanitizeIds = (input) => {
      if (!input) return [];
      if (typeof input === "string") input = [input];
      return input
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id.trim()))
        .map((id) => id.trim());
    };

    const updated = {
      title: name,
      description: details,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      startTime,
      endTime,
      venue,
      status,
      allowedPrants: [
        ...sanitizeIds(allowedPrants),
        ...(user.prant ? [user.prant] : []),
      ],
      allowedZilas: [
        ...sanitizeIds(allowedZilas),
        ...(user.zila ? [user.zila] : []),
      ],
      allowedKsheters: [
        ...sanitizeIds(allowedKsheters),
        ...(user.ksheter ? [user.ksheter] : []),
      ],
      allowedKenders: [
        ...sanitizeIds(allowedKenders),
        ...(user.kender ? [user.kender] : []),
      ],

      allowedLevels: Array.isArray(allowedLevels)
        ? allowedLevels
        : [allowedLevels],
      updatedAt: new Date(),
    };

    await Program.findByIdAndUpdate(programId, updated);
    res.redirect("/programs");
  } catch (error) {
    console.error("Error updating program:", error);
    res.status(500).send("Server error");
  }
};

// List Programs
exports.listPrograms = async (req, res) => {
  try {
    user = req.session.user;
    const programs = await Program.find({ organizer: user.id })
      .populate("organizer", "name")
      .sort({ startDate: -1 })
      .lean();

    res.render("programs/list", { programs, user: user, mode: "manage" });
  } catch (error) {
    console.error("Error listing programs:", error);
    res.status(500).send("Server error");
  }
};

exports.deleteProgram = async (req, res) => {
  try {
    const programId = req.params.id;
    await Program.findByIdAndDelete(programId);
    res.redirect("/programs");
  } catch (err) {
    console.error("Error deleting program:", err);
    res.status(500).send("Server error");
  }
};

exports.exportProgramDetail = async (req, res) => {
  try {
    const idOrSlug = req.params.id;
    const isObjectId = mongoose.Types.ObjectId.isValid(idOrSlug);
    const user = req.session.user;
    if (!user) return res.status(401).send("Login required");

    const userRoles = user.roles;

    // Fetch program with organizer details
    const program = await (
      isObjectId
        ? Program.findById(idOrSlug)
        : Program.findOne({ slug: idOrSlug })
    )
      .populate("organizer", "name phone email")
      .lean();

    if (!program) return res.status(404).send("Program not found");

    // --- Prepare scope lists ---
    let prants = [],
      zilas = [],
      ksheters = [],
      kenders = [];
    let allowedLevels = [];

    if (userRoles.some((r) => adminRoles.includes(r))) {
      prants = await Prant.find({ deleted: false }).lean();
      allowedLevels = ["prant", "zila", "ksheter", "kender"];
    } else if (userRoles.some((r) => prantRoles.includes(r))) {
      prants = await Prant.find({ _id: user.prant }).lean();
      zilas = await Zila.find({ prant: user.prant }).lean();
      allowedLevels = ["prant", "zila", "ksheter", "kender"];
    } else if (userRoles.some((r) => zilaRoles.includes(r))) {
      prants = await Prant.find({ _id: user.prant }).lean();
      zilas = await Zila.find({ _id: user.zila }).lean();
      ksheters = await Ksheter.find({ zila: user.zila }).lean();
      allowedLevels = ["zila", "ksheter", "kender"];
    } else if (userRoles.some((r) => ksheterRoles.includes(r))) {
      prants = await Prant.find({ _id: user.prant }).lean();
      zilas = await Zila.find({ _id: user.zila }).lean();
      ksheters = await Ksheter.find({ _id: user.ksheter }).lean();
      kenders = await Kender.find({ ksheter: user.ksheter }).lean();
      allowedLevels = ["ksheter", "kender"];
    } else if (userRoles.some((r) => kenderRoles.includes(r))) {
      prants = await Prant.find({ _id: user.prant }).lean();
      zilas = await Zila.find({ _id: user.zila }).lean();
      ksheters = await Ksheter.find({ _id: user.ksheter }).lean();
      kenders = await Kender.find({ _id: user.kender }).lean();
      allowedLevels = ["kender"];
    }

    // --- Fetch allowed scope data for the program ---
    const allowedPrantsData = await Prant.find({
      _id: { $in: program.allowedPrants },
    }).lean();
    const allowedZilasData = await Zila.find({
      _id: { $in: program.allowedZilas },
    }).lean();
    const allowedKshetersData = await Ksheter.find({
      _id: { $in: program.allowedKsheters },
    }).lean();
    const allowedKendersData = await Kender.find({
      _id: { $in: program.allowedKenders },
    }).lean();

    // Ensure program.allowedLevels is always available for rendering
    if (!program.allowedLevels) {
      program.allowedLevels = [];
    }
    // console.log(program.organizer._id.toString());
    // console.log(user.id);
    res.render("programs/detail", {
      program,
      user,
      adminRoles,
      prantRoles,
      zilaRoles,
      ksheterRoles,
      kenderRoles,
      prants,
      zilas,
      ksheters,
      kenders,
      allowedLevels, // viewer's allowed levels
      allowedPrants: allowedPrantsData,
      allowedZilas: allowedZilasData,
      allowedKsheters: allowedKshetersData,
      allowedKenders: allowedKendersData,
      mode: program.organizer._id.toString() == user.id ? "manage" : "register",
    });
  } catch (err) {
    console.error("exportProgramDetail error:", err);
    res.status(500).send("Server error");
  }
};

exports.listUpcoming = async (req, res) => {
  try {
    const user = req.session.user;
    if (!user) return res.redirect("/login");

    const userRoles = user.roles;
    const userLevel = userRoles.some((r) => zilaRoles.includes(r))
      ? "zila"
      : userRoles.some((r) => ksheterRoles.includes(r))
        ? "ksheter"
        : userRoles.some((r) => kenderRoles.includes(r))
          ? "kender"
          : "other";

    let query = { status: "published" };

    // Filter by allowed levels
    query.allowedLevels = { $in: [userLevel] };

    // Filter by allowed scope
    if (userLevel === "zila") {
      query.$or = [
        { allowedZilas: user.zila }, // user’s zila matches program
        { allowedZilas: { $size: 0 } }, // no restriction → all
      ];
    } else if (userLevel === "ksheter") {
      query.$or = [
        { allowedKsheters: user.ksheter },
        { allowedKsheters: { $size: 0 } },
      ];
    } else if (userLevel === "kender") {
      query.$or = [
        { allowedKenders: user.kender },
        { allowedKenders: { $size: 0 } },
      ];
    }

    const programs = await Program.find(query).sort({ startDate: 1 }).lean();

    res.render("programs/index", { programs, user });
  } catch (err) {
    console.error("Error listing programs:", err);
    res.status(500).send("Server error");
  }
};

// controllers/programController.js
exports.listAvailablePrograms = async (req, res) => {
  try {
    const user = req.session.user;
    const userRoles = user.roles || [];

    let allowedLevelsForUser = [];

    // ✅ Reverse mapping (based on your earlier logic)
    if (userRoles.some((r) => adminRoles.includes(r))) {
      allowedLevelsForUser = ["admin", "prant", "zila", "ksheter", "kender"];
    } else if (userRoles.some((r) => prantRoles.includes(r))) {
      allowedLevelsForUser = ["prant"];
    } else if (userRoles.some((r) => zilaRoles.includes(r))) {
      allowedLevelsForUser = ["zila"];
    } else if (userRoles.some((r) => ksheterRoles.includes(r))) {
      allowedLevelsForUser = ["ksheter"];
    } else if (
      userRoles.some(
        (r) => kenderRoles.includes(r) || kenderTeamRoles.includes(r)
      )
    ) {
      allowedLevelsForUser = ["kender"];
    } else if (userRoles.some((r) => saadhakRoles.includes(r))) {
      allowedLevelsForUser = ["saadhak"];
    }

    // ✅ IST midnight logic
    const nowIST = new Date(Date.now() + 5.5 * 60 * 60 * 1000);
    nowIST.setHours(0, 0, 0, 0);

    // ✅ Base query conditions
    // const andConditions = [];
    const andConditions = [
      { organizer: { $ne: user.id } },
      { endDate: { $gte: nowIST } },
      { registrationOpen: true },
      { allowedLevels: { $in: allowedLevelsForUser } },
    ];

    // ✅ Location filters — only add if user has that location set

    if (user.prant) {
      andConditions.push({
        $or: [
          { allowedPrants: { $size: 0 } },
          { allowedPrants: new mongoose.Types.ObjectId(user.prant) },
        ],
      });
    }

    if (user.zila) {
      andConditions.push({
        $or: [
          { allowedZilas: { $size: 0 } },
          { allowedZilas: new mongoose.Types.ObjectId(user.zila) },
        ],
      });
    }
    // console.log(new mongoose.Types.ObjectId(user.ksheter));

    if (user.ksheter) {
      andConditions.push({
        $or: [
          { allowedKsheters: { $size: 0 } },
          { allowedKsheters: new mongoose.Types.ObjectId(user.ksheter) },
        ],
      });
    }

    if (user.kender) {
      andConditions.push({
        $or: [
          { allowedKenders: { $size: 0 } },
          { allowedKenders: new mongoose.Types.ObjectId(user.kender) },
        ],
      });
    }

    const programs = await Program.find({ $and: andConditions })
      .populate("organizer", "name")
      .sort({ startDate: 1 })
      .lean();

    res.render("programs/list", { programs, user, mode: "register" });
  } catch (error) {
    console.error("Error listing available programs:", error);
    res.status(500).send("Server error");
  }
};

exports.registerProgram = async (req, res) => {
  try {
    const user = req.session.user;

    await Program.findByIdAndUpdate(req.params.id, {
      $addToSet: { registeredUsers: user.id }, // prevents duplicates
    });

    res.redirect("/programs/available");
  } catch (error) {
    console.error("Error registering:", error);
    res.status(500).send("Server error");
  }
};

exports.deregisterProgram = async (req, res) => {
  try {
    const user = req.session.user;

    await Program.findByIdAndUpdate(req.params.id, {
      $pull: { registeredUsers: user.id },
    });

    res.redirect("/programs/available");
  } catch (error) {
    console.error("Error deregistering:", error);
    res.status(500).send("Server error");
  }
};

// Fetch registered users for a program
exports.getRegisteredUsers = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate({
        path: 'registeredUsers',
        model: 'Saadhak',
        select: 'name mobile email role zila ksheter kender',
        populate: [
          { path: 'zila', select: 'name' },
          { path: 'ksheter', select: 'name' },
          { path: 'kender', select: 'name' },
        ],
      })
      .lean();

    if (!program) return res.status(404).send('Program not found');

    res.render('programs/registrations', {
      users: program.registeredUsers || [],
      program,
    });
  } catch (err) {
    console.error("Error fetching registrations:", err);
    res.status(500).send("Server error");
  }
};

exports.exportRegistrationsToExcel = async (req, res) => {
  try {
    const program = await Program.findById(req.params.id)
      .populate({
        path: 'registeredUsers',
        select: 'name mobile email role zila ksheter kender',
        populate: [
          { path: 'zila', select: 'name' },
          { path: 'ksheter', select: 'name' },
          { path: 'kender', select: 'name' },
        ],
      })
      .lean();

    if (!program) return res.status(404).send('Program not found');

    const data = program.registeredUsers.map((user, i) => ({
      'S.No.': i + 1,
      Name: user.name || '',
      Phone: user.mobile || '',
      Email: user.email || '',
      Roles: user.role.join(', '),
      Zila: user.zila?.name || '',
      Ksheter: user.ksheter?.name || '',
      Kender: user.kender?.name || '',
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Registered Users');

    const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });

    res.setHeader('Content-Disposition', `attachment; filename=Program_${program._id}_Registrations.xlsx`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).send("Server error");
  }
};

