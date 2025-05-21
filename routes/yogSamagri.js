const express = require("express");
const router = express.Router();
const YogSamagri = require("../models/YogSamagri");
const { ksheterRoles } = require("../config/roles");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
// Show all items
router.get("/", requireLogin, canManage(ksheterRoles), async (req, res) => {
  const items = await YogSamagri.find().sort({ name: 1 });
  res.render("yogSamagri/list", { items });
});

// Form to create new item
router.get("/new", requireLogin, canManage(ksheterRoles), (req, res) => {
  res.render("yogSamagri/new");
});

// Create new item
router.post("/", requireLogin, canManage(ksheterRoles), async (req, res) => {
  const { name, price } = req.body;
  await YogSamagri.create({ name, price });
  res.redirect("/yog-samagri");
});

// Edit form
router.get(
  "/:id/edit",
  requireLogin,
  canManage(ksheterRoles),
  async (req, res) => {
    const item = await YogSamagri.findById(req.params.id);
    res.render("yogSamagri/edit", { item });
  }
);

// Update
router.post("/:id", requireLogin, canManage(ksheterRoles), async (req, res) => {
  const { name, price } = req.body;
  await YogSamagri.findByIdAndUpdate(req.params.id, { name, price });
  res.redirect("/yog-samagri");
});

// Delete
router.post(
  "/:id/delete",
  requireLogin,
  canManage(ksheterRoles),
  async (req, res) => {
    await YogSamagri.findByIdAndDelete(req.params.id);
    res.redirect("/yog-samagri");
  }
);

router.get("/report", async (req, res) => {
  const items = await YogSamagri.find().sort({ name: 1 });
  res.render("yogSamagri/view", { items });
});

module.exports = router;
