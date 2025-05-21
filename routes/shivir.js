const express = require("express");
const router = express.Router();
const shivirController = require("../controllers/shivirController");
const ShivirRegistration = require("../models/ShivirRegistration");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { ksheterRoles } = require("../config/roles"); // ✅ DRY import

router.get("/register", shivirController.getForm);
router.post("/register", shivirController.postForm);

router.get(
  "/registrations",
  requireLogin,
  canManage(ksheterRoles),
  shivirController.listRegistrations
);
router.get(
  "/registrations/export",
  requireLogin,
  canManage(ksheterRoles),
  shivirController.exportRegistrations
);

router.post(
  "/delete/:id",
  requireLogin,
  canManage(ksheterRoles),
  shivirController.deleteRegistration
);

router.post("/check-mobile", async (req, res) => {
  const { mobile } = req.body;
  const existing = await ShivirRegistration.findOne({ mobile });
  if (existing) {
    return res.json({ exists: true });
  } else {
    return res.json({ exists: false });
  }
});

router.get("/attendance", requireLogin, canManage(ksheterRoles),shivirController.getAttendanceForm);
router.post("/attendance", requireLogin, canManage(ksheterRoles), shivirController.postAttendance);
router.get("/attendance/report", shivirController.attendanceReport);

module.exports = router;
