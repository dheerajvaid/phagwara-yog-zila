const express = require('express');
const router = express.Router();
const greetingController = require('../controllers/greetingController');

router.post('/generate', greetingController.generateGreeting);

module.exports = router;
