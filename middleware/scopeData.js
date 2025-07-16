// middleware/scopeData.js

const Zila = require('../models/Zila');
const Ksheter = require('../models/Ksheter');
const Kender = require('../models/Kender');

async function injectScopeData(req, res, next) {
  try {
    const user = req.session.user;

    res.locals.zilaList = await Zila.find().sort({ name: 1 }).lean();
    res.locals.ksheterList = await Ksheter.find().sort({ name: 1 }).lean();
    res.locals.kenderList = await Kender.find().sort({ name: 1 }).lean();

    res.locals.selectedZila = user?.zila || '';
    res.locals.selectedKsheter = user?.ksheter || '';
    res.locals.selectedKender = user?.kender || '';

    res.locals.user = user;  // required by EJS partial
    next();
  } catch (err) {
    console.error('❌ Failed to inject scope data:', err);
    next(err);
  }
}

module.exports = injectScopeData;
