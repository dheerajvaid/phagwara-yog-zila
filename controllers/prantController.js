const Prant = require("../models/prant");

// GET: All Prants
exports.listPrants = async (req, res) => {
  try {
    const prants = await Prant.find({ deleted: false }).sort({ createdAt: -1 });
    res.render("prant/list", { prants });
  } catch (err) {
    console.error("Error loading prants:", err);
    res.status(500).send("Server Error");
  }
};

// GET: Show Add Prant Form
exports.getAddForm = (req, res) => {
  res.render("prant/add", {
    formData: {},
    error: null,
  });
};

// POST: Create Prant
exports.createPrant = async (req, res) => {
  try {
    const { name } = req.body;

    const existing = await Prant.findOne({ name: name.trim(), deleted: false });
    if (existing) {
      return res.render("prant/add", {
        error:
          "❌ This Prant name already exists. Please choose a different name.",
        formData: { name },
      });
    }

    await Prant.create({ name: name.trim() });
    res.redirect("/prant/list");
  } catch (err) {
    console.error("Error creating prant:", err);
    res.status(500).send("Server Error");
  }
};

// GET: Edit Prant Form
exports.getEditForm = async (req, res) => {
  try {
    const prant = await Prant.findOne({ _id: req.params.id, deleted: false });
    if (!prant) return res.status(404).send("Not Found");
    res.render("prant/edit", { prant, error: null });
  } catch (err) {
    console.error("Error loading prant:", err);
    res.status(500).send("Server Error");
  }
};

// POST: Update Prant
exports.updatePrant = async (req, res) => {
  try {
    const { name } = req.body;
    const { id } = req.params;

    const duplicate = await Prant.findOne({
      _id: { $ne: id },  // exclude current one
      name: name.trim(),
      deleted: false
    });

    if (duplicate) {
      const prant = await Prant.findById(id);
      return res.render("prant/edit", {
        prant,
        error: "❌ A Prant with the same name already exists.",
      });
    }

    await Prant.findByIdAndUpdate(id, { name: name.trim() });
    res.redirect("/prant/list");
  } catch (err) {
    console.error("Error updating prant:", err);
    res.status(500).send("Server Error");
  }
};


// POST: Soft Delete
exports.deletePrant = async (req, res) => {
  try {
    await Prant.findByIdAndUpdate(req.params.id, {
      deleted: true,
      deletedAt: new Date(),
    });
    res.redirect("/prant/list");
  } catch (err) {
    console.error("Error deleting prant:", err);
    res.status(500).send("Server Error");
  }
};
