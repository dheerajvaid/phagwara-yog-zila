// controllers/shivirController.js
const Shivir = require('../models/Shivir');
const ShivirRegistration = require('../models/ShivirReg');

exports.showCreateForm = async (req, res) => {
    console.log('hello');
  res.render('shivir/create', { user: req.user });
};

exports.createShivir = async (req, res) => {
  const { subject, description, date, days, time, place, contactName, contactMobile, zila, ksheter, kender } = req.body;

  await Shivir.create({
    subject,
    description,
    date,
    days,
    time,
    place,
    contactPerson: { name: contactName, mobile: contactMobile },
    createdBy: req.user._id,
    zila, ksheter, kender,
    isLive: true,
  });

  res.redirect('/shivir/manage');
};

exports.manageShivirs = async (req, res) => {
  const shivirs = await Shivir.find({ createdBy: req.user._id });
  res.render('shivir/manage', { shivirs });
};

exports.listUpcomingShivirs = async (req, res) => {
  const shivirs = await Shivir.find({ isLive: true, date: { $gte: new Date() } }).sort('date');
  res.render('shivir/upcoming', { shivirs });
};

exports.viewShivirDetail = async (req, res) => {
  const shivir = await Shivir.findById(req.params.id);
  res.render('shivir/detail', { shivir });
};

exports.registerForShivir = async (req, res) => {
  const { name, mobile, gender, age, address } = req.body;
  await ShivirRegistration.create({
    shivir: req.params.id,
    saadhak: req.user?._id,
    name, mobile, gender, age, address
  });
  res.redirect(`/shivir/${req.params.id}`);
};

exports.viewRegistrations = async (req, res) => {
  const registrations = await ShivirRegistration.find({ shivir: req.params.id });
  res.render('shivir/registrations', { registrations });
};
