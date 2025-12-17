// controllers/game.controller.js

exports.logoPuzzle = (req, res) => {
  res.render('games/logoPuzzle', {
    title: 'Yog Logo Puzzle | Phagwara Yog Zila'
  });
};
