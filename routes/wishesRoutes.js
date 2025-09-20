const express = require('express');
const fs = require('fs');
const path = require('path');
const { requireLogin } = require('../middleware/authMiddleware');
const router = express.Router();

function getRandomMessage(type) {
  // Correct path to your wishes JSON
  const filePath = path.join(__dirname, '..', 'data', 'wishes', `good-${type}.json`);
  const messages = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return messages[Math.floor(Math.random() * messages.length)];
}

// GET /wishes/:type
router.get('/:type', requireLogin, (req, res) => {
  const type = req.params.type; // 'morning' or 'night'
  if (!['morning', 'night'].includes(type)) {
    return res.redirect('/');
  }

  const title = type === 'morning' ? 'शुभ प्रभात संदेश' : 'शुभ रात्रि संदेश';
  const color = type === 'morning' ? '#28a745' : '#6f42c1';
  const message = getRandomMessage(type);

  res.render('wishes/show', {
    title,
    message,
    color,
    user: req.session.user || { name: "योग साधक" } // fallback name
  });
});

module.exports = router;
