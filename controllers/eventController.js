const Event = require('../models/Event');
const { cloudinary } = require('../utils/cloudinary');

exports.getAllEvents = async (req, res) => {
  const events = await Event.find().sort({ date: -1, _id: -1 });
  res.render('events/list', { events });
};

exports.getUpcomingEvents = async () => {
  return await Event.find({ date: { $gte: new Date() } }).sort({ date: 1 }).limit(5);
};

exports.renderAddEvent = (req, res) => {
  res.render('events/add');
};

exports.createEvent = async (req, res) => {
  try {
    const { title, description, date } = req.body;

    let imageUrls = [];
    let videoUrl = '', videoPublicId = '';
    let audioUrl = '', audioPublicId = '';
    let fileUrl = '', filePublicId = '', fileResourceType = '';

    if (req.files['images']) {
      imageUrls = req.files['images'].map(file => ({
        url: file.path,
        public_id: file.filename,
      }));
    }

    if (req.files['video'] && req.files['video'][0]) {
      videoUrl = req.files['video'][0].path;
      videoPublicId = req.files['video'][0].filename;
    }

    if (req.files['audio'] && req.files['audio'][0]) {
      audioUrl = req.files['audio'][0].path;
      audioPublicId = req.files['audio'][0].filename;
    }

    if (req.files['file'] && req.files['file'][0]) {
      fileUrl = req.files['file'][0].path;
      filePublicId = req.files['file'][0].filename;
      fileResourceType = 'raw'; // ✅ Add this line
    }

    await Event.create({
      title,
      description,
      date,
      imageUrls,
      videoUrl,
      videoPublicId,
      audioUrl,
      audioPublicId,
      fileUrl,
      filePublicId,
      fileResourceType, // ✅ Save this to support deletion later
    });

    res.redirect('/events');
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating event');
  }
};


exports.viewEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);
  if (!event) return res.status(404).send('Event not found');
  res.render('events/view', { event });
};

exports.renderEditForm = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send('Event not found');
    res.render('events/edit', { event });
  } catch (err) {
    res.status(500).send('Error loading event edit form');
  }
};
