const Event = require('../models/Event');
const cloudinary = require('../utils/cloudinary');

exports.getAllEvents = async (req, res) => {
  const events = await Event.find().sort({ date: -1 });
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
    let videoUrl = [];
    let audioUrl = [];

    // Images (multiple)
    if (req.files['images']) {
      for (const file of req.files['images']) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'phagwara-yog-zila/events/images',
          resource_type: 'image',
        });
        imageUrls.push(result.secure_url);
      }
    }

    // Videos (multiple)
    if (req.files['video']) {
      for (const file of req.files['video']) {
        const videoResult = await cloudinary.uploader.upload(file.path, {
          folder: 'phagwara-yog-zila/events/videos',
          resource_type: 'video',
        });
        videoUrl.push(videoResult.secure_url);
      }
    }

    // Audios (multiple)
    if (req.files['audio']) {
      for (const file of req.files['audio']) {
        const audioResult = await cloudinary.uploader.upload(file.path, {
          folder: 'phagwara-yog-zila/events/audios',
          resource_type: 'video', // Cloudinary treats audio as video
        });
        audioUrl.push(audioResult.secure_url);
      }
    }

    await Event.create({
      title,
      description,
      date,
      imageUrls,
      videoUrl,
      audioUrl,
    });

    res.redirect('/events');
  } catch (error) {
    console.error(error);
    res.redirect('/events');
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

exports.updateEvent = async (req, res) => {
  try {
    const { title, date, description } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send('Event not found');

    event.title = title;
    event.date = date;
    event.description = description;

    // Append new images
    if (req.files['images']) {
      for (const file of req.files['images']) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'phagwara-yog-zila/events/images',
          resource_type: 'image',
        });
        event.imageUrls.push(result.secure_url);
      }
    }

    // Append new videos
    if (req.files['video']) {
      for (const file of req.files['video']) {
        const videoResult = await cloudinary.uploader.upload(file.path, {
          folder: 'phagwara-yog-zila/events/videos',
          resource_type: 'video',
        });
        event.videoUrl.push(videoResult.secure_url);
      }
    }

    // Append new audios
    if (req.files['audio']) {
      for (const file of req.files['audio']) {
        const audioResult = await cloudinary.uploader.upload(file.path, {
          folder: 'phagwara-yog-zila/events/audios',
          resource_type: 'video',
        });
        event.audioUrl.push(audioResult.secure_url);
      }
    }

    await event.save();
    res.redirect(`/events/${event._id}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating event');
  }
};


exports.deleteEvent = async (req, res) => {
  try {
    await Event.findByIdAndDelete(req.params.id);
    res.redirect('/events');
  } catch (err) {
    res.status(500).send('Error deleting event');
  }
};
