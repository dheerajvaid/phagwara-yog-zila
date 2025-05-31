const express = require('express');
const router = express.Router();
const Event = require('../../models/Event'); // adjust path if needed

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 6;
  const skip = (page - 1) * limit;
  const search = req.query.search || '';

  const query = {
    $or: [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ]
  };

  try {
    const events = await Event.find(query)
      .sort({ date: -1, _id: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Event.countDocuments(query);
    const hasMore = skip + events.length < total;

    res.json({ events, hasMore }); // imageUrls, videoUrl, audioUrl included here
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
