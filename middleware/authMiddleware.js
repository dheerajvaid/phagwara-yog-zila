const Saadhak = require('../models/Saadhak');

exports.requireLogin = async (req, res, next) => {
  try {
    const count = await Saadhak.countDocuments();

    // 🆓 Allow first-time setup
    if (count === 0) {
      console.log('🛡️ First-time setup: login bypassed');
      return next();
    }

    // 🔐 Check for logged-in user with roles
    // console.log(req.session.user);
    // console.log(Array.isArray(req.session.user.roles));

    if (!req.session.user || !Array.isArray(req.session.user.roles)) {
      
      return res.redirect('/auth/login');

    }

    next();
  } catch (err) {
    console.error('Error in login middleware:', err);
    res.status(500).send('Your Mobile number is not registered with us! Contact Nearest Yog Sadhna Kendeer!');
  }
};
