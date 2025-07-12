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

  const session = quizSessions[sessionId];
  if (!session) return res.status(404).send('Quiz session not found');

  // ✅ Handle both regular and final answer submission
  const raw = req.body?.answer ?? req.body?.finalAnswer ?? null;
  // console.log("Submitted answer:", raw);

  let normalizedAnswer = null;

  if (Array.isArray(raw)) {
    normalizedAnswer = raw.map(val => Number(val));
  } else if (typeof raw === 'string' && raw.includes(',')) {
    normalizedAnswer = raw.split(',').map(val => Number(val));
  } else if (raw !== null && raw !== '') {
    normalizedAnswer = Number(raw);
  }

  session.answers[idx] = normalizedAnswer;

  const next = idx + 1;
  if (next < session.questions.length) {
    res.redirect(`/quiz/${sessionId}?idx=${next}`);
  } else {
    // ✅ Final redirect on last question
    res.redirect(`/quiz/${sessionId}/submit`);
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

    if (userAns === null || userAns === undefined) {
      wrongDetails.push({
        question: q.text,
        options: q.options,
        userAns: [], // ✅ No answer case
        correctAns: q.correctAnswers
      });
      return;
    }

    const submittedAns = Array.isArray(userAns)
      ? userAns.map(Number)
      : [Number(userAns)];

    const correctAns = q.correctAnswers;

    const isCorrect =
      submittedAns.length === correctAns.length &&
      submittedAns.every(val => correctAns.includes(val)) &&
      correctAns.every(val => submittedAns.includes(val)); // ✅ Strict match

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

  delete quizSessions[sessionId]; // ✅ Cleanup

  res.render('quiz/result', {
    title: 'Your Quiz Result',
    result
  });
};
