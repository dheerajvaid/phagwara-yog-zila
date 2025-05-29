const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ dest: "uploads/" });
const eventController = require("../controllers/eventController");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");

const { adminOnly } = require("../config/roles");
// const saadhakManagerRoles = [...zilaRoles, ...ksheterRoles, ...kenderRoles];
// const attendanceRoles = [...kenderRoles, ...saadhakRoles];

router.get("/", eventController.getAllEvents);
router.get(
  "/add",
  requireLogin,
  canManage(adminOnly),
  eventController.renderAddEvent
);
router.post(
  "/add",
  requireLogin,
  canManage(adminOnly),
  upload.single("image"),
  eventController.createEvent
);

module.exports = router;
