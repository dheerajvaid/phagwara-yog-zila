const Ksheter = require('../models/Ksheter');
const Kender = require('../models/Kender');
const Saadhak = require('../models/Saadhak');

async function canManageKsheter(req, res, next) {
  try {
    const user = req.session.user;

    if (user.roles.includes('Admin')) return next();

    const saadhak = await Saadhak.findById(user.id);
    if (!saadhak?.zila) return res.status(403).send('❌ No Zila association found.');

    const ksheter = await Ksheter.findById(req.params.id);
    if (!ksheter) return res.status(404).send('❌ Ksheter not found.');

    if (saadhak.zila.toString() !== ksheter.zila.toString()) {
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

    const roles = req.session.user.roles;

    if (roles.includes('Admin')) return next();

    if (
      roles.includes('Zila Pradhan') ||
      roles.includes('Zila Mantri')
    ) {
      if (ksheter.zila.toString() !== req.session.user.zila?.toString()) {
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
    const roles = user.roles;

    if (roles.includes('Admin')) return next();

    if (
      roles.includes('Zila Pradhan') ||
      roles.includes('Zila Mantri')
    ) {
      if (kender.zila.toString() !== user.zila?.toString()) {
        return res.status(403).send('❌ Unauthorized: Zila mismatch.');
      }
    }

    if (
      roles.includes('Ksheter Pradhan') ||
      roles.includes('Ksheter Mantri')
    ) {
      if (kender.ksheter.toString() !== user.ksheter?.toString()) {
        return res.status(403).send('❌ Unauthorized: Ksheter mismatch.');
      }
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
    const roles = user.roles;

    if (roles.includes('Admin')) return next();

    if (
      roles.includes('Zila Pradhan') ||
      roles.includes('Zila Mantri')
    ) {
      if (saadhak.zila?.toString() !== user.zila?.toString()) {
        return res.status(403).send('❌ Unauthorized: Zila mismatch.');
      }
    }

    if (
      roles.includes('Ksheter Pradhan') ||
      roles.includes('Ksheter Mantri')
    ) {
      if (saadhak.ksheter?.toString() !== user.ksheter?.toString()) {
        return res.status(403).send('❌ Unauthorized: Ksheter mismatch.');
      }
    }

    if (
      roles.includes('Kender Pramukh') ||
      roles.includes('Seh Kender Pramukh')
    ) {
      if (saadhak.kender?.toString() !== user.kender?.toString()) {
        return res.status(403).send('❌ Unauthorized: Kender mismatch.');
      }
    }

    next();
  } catch (err) {
    console.error('Saadhak ownership error:', err);
    res.status(500).send('Server error.');
  }
}

module.exports = {
  canManageKsheter,
  checkKsheterOwnership,
  checkKenderOwnership,
  checkSaadhakOwnership
};
