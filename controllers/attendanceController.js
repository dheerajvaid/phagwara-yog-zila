const Attendance = require('../models/Attendance');
const Saadhak = require('../models/Saadhak');
const Kender = require('../models/Kender');

// Show attendance marking form
exports.showMarkAttendanceForm = async (req, res) => {
  try {
    const saadhaks = await Saadhak.find().sort({ name: 1 });
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD for default input value
    res.render('attendance/mark', { saadhaks, today });
  } catch (err) {
    console.error('Error loading mark attendance form:', err);
    res.status(500).send('Server Error');
  }
};

// Handle attendance submission
exports.markAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day

    let selectedSaadhaks = req.body.selectedSaadhaks;
    if (!selectedSaadhaks) {
      return res.status(400).send('No saadhaks selected');
    }

    if (!Array.isArray(selectedSaadhaks)) {
      selectedSaadhaks = [selectedSaadhaks];
    }

    for (let saadhakId of selectedSaadhaks) {
      const existingAttendance = await Attendance.findOne({
        saadhak: saadhakId,
        date: today,
      });

      if (existingAttendance) {
        existingAttendance.status = "Present";
        await existingAttendance.save();
      } else {
        const attendance = new Attendance({
          saadhak: saadhakId,
          date: today,
          status: "Present",
        });
        await attendance.save();
      }
    }

    res.redirect('/attendance/today');
  } catch (err) {
    console.error('Error marking attendance:', err);
    res.status(500).send('Server Error');
  }
};

// Show today's attendance
exports.viewTodayAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRecords = await Attendance.find({ date: today }).populate('saadhak');

    if (attendanceRecords.length === 0) {
      return res.render('attendance/today', { saadhaks: [], message: 'No attendance marked for today' });
    }

    res.render('attendance/today', { saadhaks: attendanceRecords });
  } catch (err) {
    console.error('Error fetching today\'s attendance:', err);
    res.status(500).send('Server Error');
  }
};

// View attendance by specific date
exports.viewAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.render('attendance/by-date', { attendance: [], selectedDate: null });
    }

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const attendance = await Attendance.find({ date: targetDate }).populate('saadhak');
    res.render('attendance/by-date', { attendance, selectedDate: date });
  } catch (err) {
    console.error('Error viewing attendance by date:', err);
    res.status(500).send('Server Error');
  }
};

// Show attendance report for a specific date
exports.showAttendanceReport = async (req, res) => {
  const date = req.params.date;
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  try {
    const attendanceRecords = await Attendance.find({ date: day }).populate('saadhak');

    if (attendanceRecords.length === 0) {
      return res.render('attendance/today', { saadhaks: [], message: 'No attendance marked for today' });
    }

    res.render('attendance/report', { attendanceRecords });
  } catch (err) {
    console.error('Error fetching attendance report:', err);
    res.status(500).send('Server Error');
  }
};

// Show attendance report filtered by Kender
exports.reportByKender = async (req, res) => {
  const kenderId = req.params.kenderId;

  try {
    const saadhaks = await Saadhak.find({ kender: kenderId });
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendanceRecords = await Attendance.find({
      saadhak: { $in: saadhaks.map(s => s._id) },
      date: today,
    }).populate('saadhak');

    res.render('attendance/kenderReport', {
      attendanceRecords,
      date: today.toISOString().split('T')[0],
    });
  } catch (err) {
    console.error('Error loading kender report:', err);
    res.status(500).send('Server Error');
  }
};

// Full report for a date (all saadhaks)
exports.fullReportByDate = async (req, res) => {
  const date = req.params.date;
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);

  try {
    const attendanceRecords = await Attendance.find({ date: day })
      .populate({
        path: 'saadhak',
        populate: { path: 'kender', select: 'name' },
      });

    res.render('attendance/fullReport', {
      attendanceRecords,
      date,
    });
  } catch (err) {
    console.error('Error loading full report:', err);
    res.status(500).send('Server Error Full Report');
  }
};

// Show filter form
exports.filteredAttendanceForm = async (req, res) => {
  const kenders = await Kender.find();
  res.render('attendance/filter', { kenders });
};

// Handle filter results
exports.filteredAttendanceResult = async (req, res) => {
  const { date, kender } = req.body;
  const query = {};

  if (date) {
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    query.date = day;
  }

  if (kender) {
    const saadhaks = await Saadhak.find({ kender });
    const saadhakIds = saadhaks.map(s => s._id);
    query.saadhak = { $in: saadhakIds };
  }

  const records = await Attendance.find(query).populate('saadhak');
  res.render('attendance/filteredResult', { records, date, kender });
};
