const Zila = require('../models/Zila');
const Ksheter = require('../models/Ksheter');
const Kender = require('../models/Kender');
const Saadhak = require('../models/Saadhak');

const ZILA_ROLES = ['Zila Pradhan', 'Zila Mantri', 'Sangathan Mantri', 'Cashier'];
const { formatName, validateName } = require('../utils/formatters');

// ✅ Show the Zila Dashboard
exports.showZilaDashboard = async (req, res) => {
  try {
    const zilas = await Zila.find().sort({ name: 1 });
    res.render('zila/manage', { zilas });
  } catch (err) {
    console.error('Error loading Zila dashboard:', err);
    res.status(500).send('Server Error');
  }
};

// ✅ Show Add Form
exports.showAddForm = (req, res) => {
  res.render('zila/add');
};

// ✅ Handle Zila Creation
exports.createZila = async (req, res) => {
  try {
    let { name } = req.body;

    if (!name || !/^[A-Za-z\s]+$/.test(name)) {
      return res.render('zila/add', {
        error: '❌ Zila name should contain alphabets and spaces only.'
      });
    }

    if (!validateName(name)) {
      return res.render('zila/add', {
        error: '❌ Zila name should contain alphabets and spaces only.'
      });
    }
    
    name = formatName(name); // format cleanly

    const existing = await Zila.findOne({ name });

    if (existing) {
      return res.render('zila/add', {
        error: '⚠️ A Zila with this name already exists.'
      });
    }

    const zila = new Zila({ name });
    await zila.save();

    res.redirect('/zila/manage');
  } catch (err) {
    console.error('Error creating Zila:', err);
    res.status(500).send('Server Error');
  }
};


// ✅ View All Zilas
exports.listZilas = async (req, res) => {
  try {
    const zilas = await Zila.find().sort({ name: 1 });
    res.render('zila/list', { zilas });
  } catch (err) {
    console.error('Error listing Zilas:', err);
    res.status(500).send('Server Error');
  }
};

// ✅ Show Edit Form
exports.showEditForm = async (req, res) => {
  const zila = await Zila.findById(req.params.id);
  if (!zila) return res.status(404).send('Zila not found');
  res.render('zila/edit', { zila });
};

// ✅ Handle Zila Update
exports.updateZila = async (req, res) => {
  try {
    let { name } = req.body;
    const zilaId = req.params.id;

    if (!name || !/^[A-Za-z\s]+$/.test(name)) {
      const zila = await Zila.findById(zilaId);
      return res.render('zila/edit', {
        zila,
        error: '❌ Zila name should contain alphabets and spaces only.'
      });
    }

    if (!validateName(name)) {
      return res.render('zila/add', {
        error: '❌ Zila name should contain alphabets and spaces only.'
      });
    }
    
    name = formatName(name); // format cleanly

    const existing = await Zila.findOne({ name, _id: { $ne: zilaId } });

    if (existing) {
      const zila = await Zila.findById(zilaId);
      return res.render('zila/edit', {
        zila,
        error: '⚠️ A Zila with this name already exists.'
      });
    }

    await Zila.findByIdAndUpdate(zilaId, { name });
    res.redirect('/zila/manage');
  } catch (err) {
    console.error('❌ Error updating Zila:', err);
    res.status(500).send('Server error while updating Zila.');
  }
};


// ✅ Handle Zila Deletion
exports.deleteZila = async (req, res) => {
  const zilaId = req.params.id;
   
  // Check dependencies
  const ksheterCount = await Ksheter.countDocuments({ zila: zilaId });
  const kenderCount = await Kender.countDocuments({ zila: zilaId });
  const saadhakCount = await Saadhak.countDocuments({ zila: zilaId });

  if (ksheterCount > 0 || kenderCount > 0 || saadhakCount > 0) {
    return res.send('❌ Cannot delete Zila with dependent Ksheter, Kenders or Saadhaks.');
  }

  await Zila.findByIdAndDelete(zilaId);
  res.redirect('/zila/manage');
};

// ✅ Show team management panel
exports.manageZilaTeam = async (req, res) => {
  const saadhaks = await Saadhak.find({
    role: { $in: ZILA_ROLES }
  }).sort({ name: 1 });

  const allSaadhaks = await Saadhak.find().sort({ name: 1 });

  res.render('zila/team', { saadhaks, allSaadhaks, ZILA_ROLES });
};

// ✅ Update role (assign or remove Zila-level role)
exports.updateZilaTeamRole = async (req, res) => {
  const { role } = req.body;
  const saadhak = await Saadhak.findById(req.params.id);

  if (!saadhak) return res.send('❌ Saadhak not found');

  if (saadhak.role.includes(role)) {
    // Remove role
    saadhak.role = saadhak.role.filter(r => r !== role);
  } else {
    // Add role
    saadhak.role.push(role);
  }

  await saadhak.save();
  res.redirect('/zila/team');
};
