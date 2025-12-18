// controllers/game.controller.js

exports.logoPuzzle = (req, res) => {
  res.render('games/logoPuzzle', {
    title: 'Yog Logo Puzzle | Phagwara Yog Zila'
  });
};


exports.smritiPuzzle = (req, res) => {
  res.render('games/smriti-puzzle', {
    title: 'Yog Smriti Puzzle | Phagwara Yog Zila'
  });
};