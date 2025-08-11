// middleware/roles.js

// ✅ Import from config/roles.js
const rolesConfig = require("../config/roles");
const roleHierarchy = rolesConfig.roleHierarchy;

function canManage(allowedRoles, calledBy = "") {
  return (req, res, next) => {
    const userRoles = req.session.user?.roles || [];

    // ✅ Admin bypass
    if (userRoles.includes("Admin")) return next();

    // ✅ Special exception for specific user & context
    if (
      req.session.user?.id === "68135e80e8a34e1065944c10" &&
      calledBy === "event"
    ) return next();

    // ✅ Sangathan Mantri bypass for events
    if (
      userRoles.includes("Sangathan Mantri") &&
      calledBy === "event"
    ) return next();

    // ✅ Check if any user role matches allowed roles
    const hasAccess = userRoles.some(role => allowedRoles.includes(role));

    if (hasAccess) {
      return next();
    } else {
      console.log("❌ Role access denied");
      return res.status(403).render("error/unauthorized");
    }
  };
}

function assignRoleLevel(req, res, next) {
  const user = req.session.user;
  
  if (!user) return next();

  const userRoles = user.roles || [];
  const roleLevels = userRoles.map(role => roleHierarchy[role] || 0);

  // ✅ Assign highest role level
  user.roleLevel = Math.max(...roleLevels, 0);

  // ✅ Make available in all EJS views
  res.locals.user = user;

  // console.log(user);

  next();
}

module.exports = {
  canManage,
  roleHierarchy,
  assignRoleLevel,
};
