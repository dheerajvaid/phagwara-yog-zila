const Question = require('../models/Question');
const { v4: uuidv4 } = require('uuid');

// Temporary in-memory session storage
const quizSessions = {};

exports.getStartForm = async (req, res) => {
  const categories = await Question.distinct('category');
  res.render('quiz/start', {
    title: 'Start Quiz',
    categories
  });
};

exports.postStartQuiz = async (req, res) => {
  const { numQuestions, categories } = req.body;
  const count = Math.min(Math.max(parseInt(numQuestions), 5), 20);

  const filter = Array.isArray(categories)
    ? { category: { $in: categories } }
    : { category: categories };

  const questions = await Question.aggregate([
    { $match: filter },
    { $sample: { size: count } } // Randomly pick questions
  ]);

  const sessionId = uuidv4();
  quizSessions[sessionId] = {
    questions,
    answers: Array(questions.length).fill(null),
    currentIdx: 0
  };

  res.redirect(`/quiz/${sessionId}`);
};

exports.getQuizPage = (req, res) => {
  const { sessionId } = req.params;
  const idx = parseInt(req.query.idx || 0);

  const session = quizSessions[sessionId];
  if (!session) return res.status(404).send('Quiz session not found');

  const { questions, answers } = session;

  if (idx < 0 || idx >= questions.length) {
    return res.redirect(`/quiz/${sessionId}?idx=0`);
  }

  res.render('quiz/page', {
    title: `Question ${idx + 1}`,
    sessionId,
    current: idx,
    total: questions.length,
    question: questions[idx],
    selectedAnswer: answers[idx]
  });
};

exports.postAnswer = (req, res) => {
  const { sessionId } = req.params;
  const idx = parseInt(req.query.idx || 0);
  const selected = req.body.answer;

  const session = quizSessions[sessionId];
  if (!session) return res.status(404).send('Quiz session not found');

  // Store answer
  session.answers[idx] = Array.isArray(selected) ? selected.map(Number) : Number(selected);

  // Go to next or redirect
  const next = idx + 1;
  if (next < session.questions.length) {
    res.redirect(`/quiz/${sessionId}?idx=${next}`);
  } else {
    res.redirect(`/quiz/${sessionId}?idx=${idx}`); // Stay on current
  }
};

exports.submitQuiz = (req, res) => {
  const { sessionId } = req.params;
  const session = quizSessions[sessionId];
  if (!session) return res.status(404).send('Quiz session not found');

  const { questions, answers } = session;

  let correct = 0;
  const wrongDetails = [];

  questions.forEach((q, i) => {
    const userAns = answers[i];

    const submittedAns = Array.isArray(userAns)
      ? userAns.map(Number)
      : userAns !== undefined
        ? [Number(userAns)]
        : [];

    const correctAns = q.correctAnswers;

    const isCorrect =
      submittedAns.length === correctAns.length &&
      submittedAns.every(val => correctAns.includes(val));

    if (isCorrect) {
      correct++;
    } else {
      wrongDetails.push({
        question: q.text,
        options: q.options,
        userAns: submittedAns,
        correctAns
      });
    }
  });

  const result = {
    total: questions.length,
    correct,
    wrong: questions.length - correct,
    wrongDetails
  };

  delete quizSessions[sessionId]; // Clean up memory if needed

  res.render('quiz/result', {
    title: 'Your Quiz Result',
    result
  });
};
