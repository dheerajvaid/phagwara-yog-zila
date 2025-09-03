const Saadhak = require('../models/Saadhak');

exports.requireLogin = async (req, res, next) => {
  try {
    const count = await Saadhak.countDocuments();

    // 🆓 Allow first-time setup
    if (count === 0) {
      // console.log('🛡️ First-time setup: login bypassed');
      return next();
    }

    // console.log('🔍 Session user:', req.session.user);
    // console.log('🔍 Session cookie:', req.session.cookie);

    // 🔐 Check for logged-in user with roles
    // console.log(req.session.user);
    // console.log(Array.isArray(req.session.user.roles));

    if (!req.session.user || !Array.isArray(req.session.user.roles)) {
      // console.log("🚫 Not logged in — redirecting to login");
      return res.redirect('/auth/login');

    }
    //  console.log("✅ User logged in:", req.session.user.name);
    next();
  } catch (err) {
    // console.error('Error in login middleware:', err);
    res.status(500).send('Your Mobile number is not registered with us! Contact Nearest Yog Sadhna Kendeer!');
  }
};
