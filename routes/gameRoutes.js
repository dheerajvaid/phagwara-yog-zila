/* ======================================
   Yog Logo Puzzle – Routes & Controller
   ====================================== */

// ---------- routes/game.routes.js ----------
const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');

// Logo Puzzle Route
router.get('/logo-puzzle', gameController.logoPuzzle);

module.exports = router;


// ---------- controllers/game.controller.js ----------
exports.logoPuzzle = (req, res) => {
  res.render('games/logoPuzzle', {
    title: 'Yog Logo Puzzle | Phagwara Yog Zila'
  });
};


/* ---------- app.js / main server file ----------

const gameRoutes = require('./routes/game.routes');
app.use('/games', gameRoutes);

--------------------------------------------- */