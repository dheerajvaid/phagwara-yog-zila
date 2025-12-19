// controllers/game.controller.js

exports.logoPuzzle = (req, res) => {
  res.render('games/logo-puzzle', {
    title: 'Yog Logo Puzzle'
  });
};


exports.smritiPuzzle = (req, res) => {
  res.render('games/smriti-puzzle', {
    title: 'Yog Smriti Puzzle'
  });
};


exports.shufflePuzzle = (req, res) => {
  res.render('games/shuffle-puzzle', {
    title: 'Yog Shuffle Puzzle'
  });
};