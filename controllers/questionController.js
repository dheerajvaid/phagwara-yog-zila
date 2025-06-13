const Question = require('../models/Question');

exports.getAddQuestionForm = (req, res) => {
  res.render('question/add', {
    title: 'Add New Question',
  });
};

exports.postAddQuestion = async (req, res) => {
  try {
    const { text, options, correctAnswers, category } = req.body;

    const question = new Question({
      text,
      options: Array.isArray(options) ? options : [options],
      correctAnswers: Array.isArray(correctAnswers) ? correctAnswers.map(Number) : [Number(correctAnswers)],
      category
    });

    await question.save();
    res.redirect('/question/list'); // We'll build this page next
  } catch (err) {
    console.error('Error saving question:', err);
    res.status(500).send('Internal Server Error');
  }
};
