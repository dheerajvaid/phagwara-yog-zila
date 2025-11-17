const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');

router.get('/start', quizController.getStartForm);
router.post('/start', quizController.postStartQuiz);
router.get('/:sessionId', quizController.getQuizPage);
router.post('/:sessionId/answer', quizController.postAnswer);
router.post('/:sessionId/submit', quizController.submitQuiz);
router.get('/:sessionId/submit', quizController.submitQuiz);
router.post("/print", quizController.printQuiz);

module.exports = router;
