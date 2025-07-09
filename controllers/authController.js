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

exports.getChangePassword = (req, res) => {
  res.render('auth/change-password'); // Ensure you have this EJS file
};



exports.changePassword = async (req, res) => {
  try {

    
    const { newPassword, confirmPassword } = req.body || {};

    // Basic validations
    if (!newPassword || !confirmPassword) {
      return res.render('auth/change-password', { message: 'Please fill in all fields.' });
    }

    if (newPassword.length < 1) {
      return res.render('auth/change-password', { message: 'Password must be at least 1 characters.' });
    }

    if (newPassword !== confirmPassword) {
      return res.render('auth/change-password', { message: 'Passwords do not match.' });
    }

    // Find logged-in user
    const user = await Saadhak.findById(req.session.user.id);
    if (!user) {
      return res.render('auth/change-password', { message: 'User not found.' });
    }

    // Optional: Check if new password is same as old one
    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.render('auth/change-password', { message: 'New password must be different from the old password.' });
    }

    // Hash and save new password
    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    await user.save();

    return res.render('auth/change-password', { message: '✅ Password changed successfully.' });
  } catch (err) {
    console.error('Error changing password:', err);
    return res.render('auth/change-password', { message: 'An error occurred. Please try again.' });
  }
};

