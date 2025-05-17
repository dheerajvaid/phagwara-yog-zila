const Saadhak = require("../models/Saadhak");
const bcrypt = require("bcryptjs");
const { validateMobile } = require("../utils/validators");

// Show login form
exports.showLoginForm = (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("auth/login", { error: "" });
};

// Process mobile number (check if registered)
exports.checkMobile = async (req, res) => {
  const { mobile } = req.body;
  if (!validateMobile(mobile)) {
    return res.render("auth/login", { error: "❌ Mobile not registered." });
  }

  const saadhakCount = await Saadhak.countDocuments();
  const saadhak = await Saadhak.findOne({ mobile });

  if (!saadhak && saadhakCount > 0) {
    return res.render("auth/login", { error: "❌ Invalid Mobile Number" });
  }

  // First admin registration flow
  if (!saadhak && saadhakCount === 0) {
    const firstSaadhak = new Saadhak({
      name: "Super Admin",
      mobile,
      role: ["Admin", "Zila Mantri"],
    });
    await firstSaadhak.save();
    console.log("🌟 First Admin created with mobile:", mobile);
    return res.redirect(`/auth/create-password?mobile=${mobile}`);
  }

  // If password not yet created
  if (!saadhak.password) {
    return res.redirect(`/auth/create-password?mobile=${mobile}`);
  }

  // Redirect to password login form
  res.redirect(`/auth/login-password?mobile=${mobile}`);
};

// Show password creation form
exports.showCreatePasswordForm = (req, res) => {
  res.render("auth/create-password", { mobile: req.query.mobile });
};

// Handle password creation
exports.createPassword = async (req, res) => {
  const { mobile, password } = req.body;
  const saadhak = await Saadhak.findOne({ mobile });

  if (!saadhak) {
    return res.redirect("/auth/login");
  }

  const hashed = await bcrypt.hash(password, 10);
  saadhak.password = hashed;
  await saadhak.save();

  // ✅ Set session
  req.session.user = {
    id: saadhak._id,
    name: saadhak.name,
    mobile: saadhak.mobile,
    roles: saadhak.roles || saadhak.role || ["Saadhak"],
    zila: saadhak.zila,
    ksheter: saadhak.ksheter,
    kender: saadhak.kender,
  };

  res.redirect("/dashboard");
};

// Show login with password form
exports.showLoginPasswordForm = (req, res) => {
  res.render("auth/login-password", { mobile: req.query.mobile, error: null });
};

// Handle password login
exports.loginWithPassword = async (req, res) => {
  const { mobile, password } = req.body;
  const saadhak = await Saadhak.findOne({ mobile });

  if (!saadhak || !saadhak.password) {
    return res.render("auth/login-password", {
      mobile,
      error: "❌ Invalid login.",
    });
  }

  const isMatch = await bcrypt.compare(password, saadhak.password);
  if (!isMatch) {
    return res.render("auth/login-password", {
      mobile,
      error: "❌ Incorrect password.",
    });
  }

  // ✅ Set session
  req.session.user = {
    id: saadhak._id,
    name: saadhak.name,
    mobile: saadhak.mobile,
    roles: saadhak.roles || saadhak.role || ["Saadhak"],
    zila: saadhak.zila,
    ksheter: saadhak.ksheter,
    kender: saadhak.kender,
  };

  res.redirect("/dashboard");
};

// Logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};
