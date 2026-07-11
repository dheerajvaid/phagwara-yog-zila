const Prant = require("../models/Prant");
const Zila = require("../models/Zila");
const Ksheter = require("../models/Ksheter");
const Kender = require("../models/Kender");

exports.showIdCard = async (req, res) => {
  try {
    const user = req.session.user;

    if (!user) {
      return res.status(401).send("You are not logged in.");
    }

    // console.log("SESSION PHOTO URL:", user.photoUrl);
    // console.log("SESSION APPROVAL:", user.photoApprovalStatus);
    // console.log("SESSION PHOTO URL:", req.session.user.photoUrl);
    // console.log("SESSION APPROVAL:", req.session.user.photoApprovalStatus);

    // --- Ensure roles stays an array ---
    const safeUser = {
      id: user.id,
      name: user.name || "",
      mobile: user.mobile || "",
      roles: Array.isArray(user.roles) ? user.roles : [user.roles || "Member"],
      prant: user.prant || "",
      zila: user.zila || "",
      ksheter: user.ksheter || "",
      kender: user.kender || "",
      roleLevel: user.roleLevel || "",
      photoUrl: user.photoUrl || "",
      photoPublicId: user.photoPublicId || "",
      photoApprovalStatus: user.photoApprovalStatus || "rejected",
    };

    
    // --- FETCH TITLES BASED ON USER LEVEL ---
    let prantName = "";
    let zilaName = "";
    let ksheterName = "";
    let kenderName = "";

    // Fetch in reverse hierarchy so no wrong undefined errors

    if (safeUser.kender) {
      const k = await Kender.findById(safeUser.kender).lean();
      if (k) kenderName = k.name;
    }

    if (safeUser.ksheter) {
      const ks = await Ksheter.findById(safeUser.ksheter).lean();
      if (ks) ksheterName = ks.name;
    }

    if (safeUser.zila) {
      const z = await Zila.findById(safeUser.zila).lean();
      if (z) zilaName = z.name;
    }

    if (safeUser.prant) {
      const p = await Prant.findById(safeUser.prant).lean();
      if (p) prantName = p.name;
    }

    // console.log(user.name);
    // console.log(user.photoApprovalStatus);
    // // --- SEND TO VIEW ---
    return res.render("idcard/show", {
      user: safeUser,
      prantName,
      zilaName,
      ksheterName,
      kenderName,
    });
  } catch (err) {
    console.log("ID CARD ERROR:", err);
    res.status(500).send("Error generating ID Card");
  }
};
