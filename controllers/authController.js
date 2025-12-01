const Saadhak = require("../models/Saadhak");
const bcrypt = require("bcryptjs");
const { validateMobile } = require("../utils/validators");

// 🔁 Helper: Set session user
function setSessionUser(req, saadhak) {
  const { password, ...userWithoutPassword } = saadhak.toObject();
  req.session.user = {
    id: saadhak._id,
    name: saadhak.name,
    mobile: saadhak.mobile,
    roles: saadhak.roles || saadhak.role || ["Saadhak"],
    prant: saadhak.prant,
    zila: saadhak.zila,
    ksheter: saadhak.ksheter,
    kender: saadhak.kender,
    photoUrl: saadhak.photoUrl,
    photoPublicId: saadhak.photoPublicId,    
  };
}

// 🔁 Helper: Validate and set password
async function handlePasswordMatch(res, inputPassword, saadhak) {
  const isMatch = await bcrypt.compare(inputPassword, saadhak.password);
  if (!isMatch) {
    return res.render("auth/login-password", {
      mobile: saadhak.mobile,
      error: "❌ Incorrect password.",
    });
  }
  return true;
}

// 📍 Show login form
exports.showLoginForm = (req, res) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }
  res.render("auth/login", { error: "" });
};

// 🔎 Process mobile
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

  // First admin setup
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

  if (!saadhak.password) {
    return res.redirect(`/auth/create-password?mobile=${mobile}`);
  }

  res.redirect(`/auth/login-password?mobile=${mobile}`);
};

// 📍 Show password creation form
exports.showCreatePasswordForm = (req, res) => {
  res.render("auth/create-password", { mobile: req.query.mobile });
};

// 🔐 Handle password creation
exports.createPassword = async (req, res) => {
  const { mobile, password } = req.body;
  const saadhak = await Saadhak.findOne({ mobile });

  if (!saadhak) {
    return res.redirect("/auth/login");
  }

  const hashed = await bcrypt.hash(password, 10);
  saadhak.password = hashed;
  await saadhak.save();

  setSessionUser(req, saadhak);
  res.redirect("/dashboard");
};

// 📍 Show login with password
exports.showLoginPasswordForm = (req, res) => {
  res.render("auth/login-password", { mobile: req.query.mobile, error: null });
};

// 🔓 Handle password login
exports.loginWithPassword = async (req, res) => {
  const { mobile, password } = req.body;
  const saadhak = await Saadhak.findOne({ mobile });

  if (!saadhak || !saadhak.password) {
    return res.render("auth/login-password", {
      mobile,
      error: "❌ Invalid login.",
    });
  }

  const isMatch = await handlePasswordMatch(res, password, saadhak);
  if (isMatch !== true) return isMatch;

  setSessionUser(req, saadhak);
  // ✅ Force cookie maxAge at login time
  req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000;
  res.redirect("/dashboard");
};

// 🔒 Logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
};

// 📍 Show change password form
exports.getChangePassword = (req, res) => {
  res.render("auth/change-password");
};

// 🔁 Change password logic
exports.changePassword = async (req, res) => {
  try {
    const { newPassword, confirmPassword } = req.body || {};

    if (!newPassword || !confirmPassword) {
      return res.render("auth/change-password", { message: "Please fill in all fields." });
    }

    if (newPassword.length < 1) {
      return res.render("auth/change-password", { message: "Password must be at least 1 characters." });
    }

    if (newPassword !== confirmPassword) {
      return res.render("auth/change-password", { message: "Passwords do not match." });
    }

    const user = await Saadhak.findById(req.session.user.id);
    if (!user) {
      return res.render("auth/change-password", { message: "User not found." });
    }

    const isSame = await bcrypt.compare(newPassword, user.password);
    if (isSame) {
      return res.render("auth/change-password", {
        message: "New password must be different from the old password.",
      });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    user.password = hashed;
    await user.save();

    return res.render("auth/change-password", { message: "✅ Password changed successfully." });
  } catch (err) {
    console.error("Error changing password:", err);
    return res.render("auth/change-password", {
      message: "An error occurred. Please try again.",
    });
  }
};
