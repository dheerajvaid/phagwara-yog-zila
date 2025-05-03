const Saadhak = require('../models/Saadhak');
const Kender = require('../models/Kender');
const Ksheter = require('../models/Ksheter');

const ALL_ROLES = [
  'Saadhak', 'Karyakarta', 'Shikshak', 'Seh Kender Pramukh', 'Kender Pramukh',
  'Ksheter Mantri', 'Ksheter Pradhan', 'Zila Mantri', 'Zila Pradhan', 'Sangathan Mantri', 'Cashier'
];

const ROLE_META = {
  'Saadhak': { icon: '🧘‍♂️', color: 'bg-secondary', desc: 'Regular member who attends sessions' },
  'Karyakarta': { icon: '🤝', color: 'bg-info', desc: 'Volunteer helping daily activities' },
  'Shikshak': { icon: '📖', color: 'bg-success', desc: 'Teaches yoga and kriyas at Kender level' },
  'Seh Kender Pramukh': { icon: '🧑‍💼', color: 'bg-warning', desc: 'Assistant Kender head' },
  'Kender Pramukh': { icon: '🏠', color: 'bg-primary', desc: 'Head of a specific Kender' },
  'Ksheter Mantri': { icon: '🗂️', color: 'bg-dark', desc: 'Coordinator for multiple Kendras under Ksheter' },
  'Ksheter Pradhan': { icon: '📌', color: 'bg-dark text-light', desc: 'Top lead for a Ksheter region' },
  'Zila Mantri': { icon: '📋', color: 'bg-primary', desc: 'Secretary at Zila level' },
  'Zila Pradhan': { icon: '👑', color: 'bg-danger', desc: 'President of the entire Zila' },
  'Sangathan Mantri': { icon: '🔗', color: 'bg-success', desc: 'Connects Ksheter teams with Zila team' },
  'Cashier': { icon: '💰', color: 'bg-warning text-dark', desc: 'Handles all financial transactions' }
};

exports.showRolePanel = async (req, res) => {
    const { kender, ksheter } = req.query;
  
    let query = {};
    if (kender) query.kender = kender;
    if (ksheter) query['kender.ksheter'] = ksheter; // only works with population logic
  
    const saadhaks = await Saadhak.find(query).populate({
      path: 'kender',
      populate: { path: 'ksheter' }
    }).sort({ name: 1 });
  
    const allKenders = await Kender.find().populate('ksheter');
    const allKsheter = await Ksheter.find();
  
    res.render('roles/panel', {
      saadhaks,
      ALL_ROLES,
      ROLE_META,
      allKenders,
      allKsheter,
      selectedKender: kender,
      selectedKsheter: ksheter
    });
  };

exports.updateRole = async (req, res) => {
  const { role } = req.body;
  const saadhak = await Saadhak.findById(req.params.id);

  if (!saadhak) return res.send('User not found');

  if (saadhak.role.includes(role)) {
    saadhak.role = saadhak.role.filter(r => r !== role);
  } else {
    saadhak.role.push(role);
  }

  await saadhak.save();
  res.redirect('/roles/manage');
};
