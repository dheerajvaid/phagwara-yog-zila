const roleHierarchy = {
  'Saadhak': 10,
  'Karyakarta': 20,
  'Shikshak': 20,
  'Seh Kender Pramukh': 40,
  'Kender Pramukh': 40,
  'Ksheter Mantri': 60,
  'Ksheter Pradhan': 60,
  'Zila Mantri': 80,
  'Zila Pradhan': 80,
  'Sangathan Mantri': 80,
  'Cashier': 80,
  'Admin': 100
};

function canManage(allowedRoles) {
  return (req, res, next) => {
    const userRoles = req.session.user?.roles || [];

    // Admins bypass checks
    if (userRoles.includes('Admin')) return next();

    // Check if any of the user roles is allowed
    const hasAccess = userRoles.some(role => allowedRoles.includes(role));

    if (hasAccess) {
      console.log('✅ Role authorized');
      next();
    } else {
      console.log('❌ Role access denied');
      res.status(403).send('❌ You are not authorized to access this.');
    }
  };
}

module.exports = {
  canManage,
  roleHierarchy
};
