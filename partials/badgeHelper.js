const {
  adminRoles,
  prantRoles,
  zilaRoles,
  ksheterRoles,
  kenderRoles,
  kenderTeamRoles,
  saadhakRoles,
} = require("../config/roles");

module.exports = function getBadgeColor(role) {
  if (adminRoles.includes(role)) return "danger";
  if (prantRoles.includes(role)) return "warning";
  if (zilaRoles.includes(role)) return "success";
  if (ksheterRoles.includes(role)) return "info";
  if (kenderRoles.includes(role)) return "primary";
  if (kenderTeamRoles.includes(role)) return "dark";
  if (saadhakRoles.includes(role)) return "secondary";
  return "secondary"; // fallback
};
