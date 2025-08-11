// config/roles.js
const adminRoles = ["Admin"];

const prantRoles = [
  "Prant Sanrakshak",
  "Prant Pradhan",
  "Prant Upp Pradhan",
  "Prant Mantri",
  "Prant Sangathan Mantri",
  "Prant Cashier",
];

const zilaRoles = [
  "Zila Pradhan",
  "Zila Upp Pradhan",
  "Zila Mantri",
  "Zila Sangathan Mantri",
  "Zila Sanrakshak",
  "Zila Cashier",
];

const ksheterRoles = [
  "Ksheter Pradhan",
  "Ksheter Upp Pradhan",
  "Ksheter Mantri",
  "Ksheter Sangathan Mantri",
  "Ksheter Cashier",
];

const kenderRoles = ["Kender Pramukh", "Seh Kender Pramukh"];
const kenderTeamRoles = ["Shikshak", "Karyakarta"];
const saadhakRoles = ["Saadhak"];

// Define hierarchy values (higher = more powerful)
const levelMap = {
  Admin: 120,
  Prant: 100,
  Zila: 80,
  Ksheter: 60,
  Kender: 40,
  KenderTeam: 20,
  Saadhak: 10,
};

// Build roleHierarchy from the groups above
const roleHierarchy = {};

adminRoles.forEach(r => roleHierarchy[r] = levelMap.Admin);
prantRoles.forEach(r => roleHierarchy[r] = levelMap.Prant);
zilaRoles.forEach(r => roleHierarchy[r] = levelMap.Zila);
ksheterRoles.forEach(r => roleHierarchy[r] = levelMap.Ksheter);
kenderRoles.forEach(r => roleHierarchy[r] = levelMap.Kender);
kenderTeamRoles.forEach(r => roleHierarchy[r] = levelMap.KenderTeam);
saadhakRoles.forEach(r => roleHierarchy[r] = levelMap.Saadhak);

module.exports = {
  adminRoles,
  prantRoles,
  zilaRoles,
  ksheterRoles,
  kenderRoles,
  kenderTeamRoles,
  saadhakRoles,
  roleHierarchy,
};
