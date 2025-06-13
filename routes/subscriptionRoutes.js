const express = require('express');
const router = express.Router();

const subscriptionController = require('../controllers/subscriptionController');

// New subscription form
router.get('/new', subscriptionController.newForm);

// Create subscription
router.post('/create', subscriptionController.create);

router.get('/list', subscriptionController.list);

router.post('/push', subscriptionController.pushYogManzri);

module.exports = router;
