const Ksheter = require('../models/Ksheter');
const Kender = require('../models/Kender');
const Saadhak = require('../models/Saadhak');
const {
  adminRoles,
  prantRoles,
  zilaRoles,
  ksheterRoles,
  kenderRoles
} = require('../config/roles');

// Helper to check if user has any role from a list
function hasRole(user, allowedRoles) {
  return user?.roles?.some(role => allowedRoles.includes(role));
}

// Helper to compare ObjectIds
function isSameId(a, b) {
  return a?.toString() === b?.toString();
}

// ========== MIDDLEWARES ==========

async function canManageKsheter(req, res, next) {
  try {
    const user = req.session.user;
    if (hasRole(user, adminRoles)) return next();
    if (hasRole(user, prantRoles)) return next();

    const saadhak = await Saadhak.findById(user.id);
    if (!saadhak?.zila) {
      return res.status(403).send('❌ No Zila association found.');
    }

    const ksheter = await Ksheter.findById(req.params.id);
    if (!ksheter) {
      return res.status(404).send('❌ Ksheter not found.');
    }

    if (!isSameId(saadhak.zila, ksheter.zila)) {
      return res.status(403).send('❌ Unauthorized: different Zila.');
    }

    next();
  } catch (err) {
    console.error('Ownership check failed:', err);
    res.status(500).send('Server error during ownership check.');
  }
}

async function checkKsheterOwnership(req, res, next) {
  try {
    const ksheter = await Ksheter.findById(req.params.id);
    if (!ksheter) return res.status(404).send('❌ Ksheter not found.');

    const user = req.session.user;

    if (hasRole(user, adminRoles) || hasRole(user, prantRoles)) return next();

    if (hasRole(user, zilaRoles)) {
      if (!isSameId(ksheter.zila, user.zila)) {
        return res.status(403).send('❌ Unauthorized: Zila mismatch.');
      }
    }

    next();
  } catch (err) {
    console.error('Ksheter ownership error:', err);
    res.status(500).send('Server error.');
  }
}

async function checkKenderOwnership(req, res, next) {
  try {
    const kender = await Kender.findById(req.params.id);
    if (!kender) return res.status(404).send('❌ Kender not found.');

    const user = req.session.user;

    if (hasRole(user, adminRoles) || hasRole(user, prantRoles)) return next();

    if (hasRole(user, zilaRoles) && !isSameId(kender.zila, user.zila)) {
      return res.status(403).send('❌ Unauthorized: Zila mismatch.');
    }

    if (hasRole(user, ksheterRoles) && !isSameId(kender.ksheter, user.ksheter)) {
      return res.status(403).send('❌ Unauthorized: Ksheter mismatch.');
    }

    next();
  } catch (err) {
    console.error('Kender ownership error:', err);
    res.status(500).send('Server error.');
  }
}

async function checkSaadhakOwnership(req, res, next) {
  try {
    const saadhak = await Saadhak.findById(req.params.id);
    if (!saadhak) return res.status(404).send('❌ Saadhak not found.');

    const user = req.session.user;

    if (hasRole(user, adminRoles) || hasRole(user, prantRoles)) return next();

    if (hasRole(user, zilaRoles) && !isSameId(saadhak.zila, user.zila)) {
      return res.status(403).send('❌ Unauthorized: Zila mismatch.');
    }

    if (hasRole(user, ksheterRoles) && !isSameId(saadhak.ksheter, user.ksheter)) {
      return res.status(403).send('❌ Unauthorized: Ksheter mismatch.');
    }

    if (hasRole(user, kenderRoles) && !isSameId(saadhak.kender, user.kender)) {
      return res.status(403).send('❌ Unauthorized: Kender mismatch.');
    }

    next();
  } catch (err) {
    console.error('Saadhak ownership error:', err);
    res.status(500).send('Server error.');
  }
}

// Export all middleware functions
module.exports = {
  canManageKsheter,
  checkKsheterOwnership,
  checkKenderOwnership,
  checkSaadhakOwnership
};
