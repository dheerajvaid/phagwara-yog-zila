const Kender = require('../models/Kender');
const Saadhak = require('../models/Saadhak');
const Ksheter = require('../models/Ksheter');
const Zila = require('../models/Zila');
const getBadgeColor = require('../partials/badgeHelper');

exports.showExploreHome = async (req, res) => {
  const zilas = await Zila.find().sort({ name: 1 });
  res.render('explore/index', { zilas });
};

exports.showZilaDetails = async (req, res) => {
    const zila = await Zila.findById(req.params.id);
    if (!zila) return res.send('❌ Zila not found');
  
    const ksheters = await Ksheter.find({ zila: zila._id }).sort({ name: 1 });
  
    const zilaTeam = await Saadhak.find({
      zila: zila._id,
      role: { $in: ['Zila Pradhan', 'Zila Mantri', 'Sangathan Mantri', 'Cashier'] }
    });
  
    res.render('explore/zila', { zila, zilaTeam, ksheters, getBadgeColor });
  };

  exports.showKsheterDetails = async (req, res) => {
    const ksheter = await Ksheter.findById(req.params.id).populate('zila');
    if (!ksheter) return res.send('❌ Ksheter not found');
  
    const kenders = await Kender.find({ ksheter: ksheter._id }).populate('zila');
    
    const ksheterTeam = await Saadhak.find({
      ksheter: ksheter._id,
      role: { $in: ['Ksheter Pradhan', 'Ksheter Mantri'] }
    });
  
    res.render('explore/ksheter', {
      ksheter,
      ksheterTeam,
      kenders, getBadgeColor
    });
  };

  exports.showKenderDetails = async (req, res) => {
    const kender = await Kender.findById(req.params.id)
      .populate('ksheter')
      .populate('zila');
  
    if (!kender) return res.send('❌ Kender not found');
  
    const kenderTeam = await Saadhak.find({
      kender: kender._id,
      role: {
        $in: ['Kender Pramukh', 'Seh Kender Pramukh', 'Shikshak', 'Karyakarta']
      }
    });
  
    res.render('explore/kender', {
      kender,
      kenderTeam, getBadgeColor
    });
  };