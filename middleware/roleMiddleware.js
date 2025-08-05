const roleHierarchy = {
  "Saadhak": 10,
  "Karyakarta": 20,
  "Shikshak": 20,
  "Seh Kender Pramukh": 40,
  "Kender Pramukh": 40,
  "Ksheter Mantri": 60,
  "Ksheter Pradhan": 60,
  "Zila Mantri": 80,
  "Zila Pradhan": 80,
  "Sangathan Mantri": 80,
  "Cashier": 80,
  "Admin": 100,
};

function canManage(allowedRoles, calledBy = "") {
  return (req, res, next) => {
     console.log(allowedRoles);

    const userRoles = req.session.user?.roles || [];
    // console.log(userRoles);
    // Admins bypass checks
    // console.log(req.session.user);
    // console.log(userRoles);
    if (userRoles.includes("Admin")) return next();

    if (
      req.session.user.id == "68135e80e8a34e1065944c10" &&
      calledBy == "event"
    )
      return next();

     if (
      userRoles.includes("Sangathan Mantri") &&
      calledBy == "event"
    )
      return next();  
    // console.log(allowedRoles);
    // console.log(req.session.user.roles);
    // Check if any of the user roles is allowed
    // console.log(allowedRoles);
    const hasAccess = userRoles.some((role) => allowedRoles.includes(role));
    // console.log(hasAccess);

    if (hasAccess) {
      // console.log('✅ Role authorized');
      next();
    } else {
      console.log("❌ Role access denied");
      return res.status(403).render('error/unauthorized');
    }
  };
}

function assignRoleLevel(req, res, next) {
  const user = req.session.user;
  if (!user) return next();

  const userRoles = user.roles || [];
  const roleLevels = userRoles.map(role => roleHierarchy[role] || 0);

  user.roleLevel = Math.max(...roleLevels, 0);  // Highest roleLevel
  res.locals.user = user;  // Make available in all EJS views

  next();
}


module.exports = {
  canManage,
  roleHierarchy,
  assignRoleLevel,
};
