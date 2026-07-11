const Saadhak = require("../models/Saadhak");

module.exports = async function refreshSessionPhoto(req, res, next) {
  try {
    if (!req.session.user?.id) {
      return next();
    }

    const saadhak = await Saadhak.findById(req.session.user.id).select(
      "photoUrl photoPublicId photoApprovalStatus"
    );

    if (!saadhak) {
      return next();
    }

    const approved = saadhak.photoApprovalStatus === "approved";

    req.session.user.photoApprovalStatus = saadhak.photoApprovalStatus;

    req.session.user.photoUrl = approved
      ? saadhak.photoUrl || ""
      : "";

    req.session.user.photoPublicId = approved
      ? saadhak.photoPublicId || ""
      : "";

    next();

  } catch (err) {
    console.error("Refresh Session Photo:", err);
    next();
  }
};