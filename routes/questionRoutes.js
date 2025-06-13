const express = require('express');
const router = express.Router();
const questionController = require('../controllers/questionController');

// Show add question form
router.get('/add', questionController.getAddQuestionForm);

// Handle form submission
router.post('/add', questionController.postAddQuestion);

module.exports = router;
