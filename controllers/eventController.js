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
    let videoUrl = '';
    let audioUrl = '';
    let fileUrl = '';

    // Images
    if (req.files['images']) {
      for (const file of req.files['images']) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'phagwara-yog-zila/events/images',
          resource_type: 'image',
        });
        imageUrls.push(result.secure_url);
      }
    }

    // Video
    if (req.files['video'] && req.files['video'][0]) {
      const videoResult = await cloudinary.uploader.upload(req.files['video'][0].path, {
        folder: 'phagwara-yog-zila/events/videos',
        resource_type: 'video',
      });
      videoUrl = videoResult.secure_url;
    }

    // Audio
    if (req.files['audio'] && req.files['audio'][0]) {
      const audioResult = await cloudinary.uploader.upload(req.files['audio'][0].path, {
        folder: 'phagwara-yog-zila/events/audios',
        resource_type: 'video', // audio is treated as 'video' by Cloudinary
      });
      audioUrl = audioResult.secure_url;
    }

    // File (PDF, ZIP, DOCX, etc.)
    if (req.files['file'] && req.files['file'][0]) {
      const fileResult = await cloudinary.uploader.upload(req.files['file'][0].path, {
        folder: 'phagwara-yog-zila/events/files',
        resource_type: 'raw', // ✅ changed from 'raw' to 'auto'
        type: 'upload',
      });
      fileUrl = fileResult.secure_url;
    }

    await Event.create({
      title,
      description,
      date,
      imageUrls,
      videoUrl,
      audioUrl,
      fileUrl,
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

exports.updateEvent = async (req, res) => {
  try {
    console.log('Form body:', req.body);
    const { title, date, description, deleteImages, deleteVideo, deleteAudio, deleteFile } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).send('Event not found');

    event.title = title;
    event.date = date;
    event.description = description;

    // Delete selected images
    if (deleteImages) {
      const deleteArray = Array.isArray(deleteImages) ? deleteImages : [deleteImages];
      event.imageUrls = event.imageUrls.filter(url => !deleteArray.includes(url));
    }

    // Delete video if checkbox selected
    if (deleteVideo) {
      event.videoUrl = '';
    }

    // Delete audio if checkbox selected
    if (deleteAudio) {
      event.audioUrl = '';
    }

    // Delete file if checkbox selected
    if (deleteFile) {
      event.fileUrl = '';
    }

    // Add new images
    if (req.files['images']) {
      for (const file of req.files['images']) {
        const result = await cloudinary.uploader.upload(file.path, {
          folder: 'phagwara-yog-zila/events/images',
          resource_type: 'image',
        });
        event.imageUrls.push(result.secure_url);
      }
    }

    // Replace video
    if (req.files['video'] && req.files['video'][0]) {
      const videoResult = await cloudinary.uploader.upload(req.files['video'][0].path, {
        folder: 'phagwara-yog-zila/events/videos',
        resource_type: 'video',
      });
      event.videoUrl = videoResult.secure_url;
    }

    // Replace audio
    if (req.files['audio'] && req.files['audio'][0]) {
      const audioResult = await cloudinary.uploader.upload(req.files['audio'][0].path, {
        folder: 'phagwara-yog-zila/events/audios',
        resource_type: 'video',
      });
      event.audioUrl = audioResult.secure_url;
    }

    // Replace file
    if (req.files['file'] && req.files['file'][0]) {
      const fileResult = await cloudinary.uploader.upload(req.files['file'][0].path, {
        folder: 'phagwara-yog-zila/events/files',
        resource_type: 'raw',
        type: 'upload',
      });
      event.fileUrl = fileResult.secure_url;
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
