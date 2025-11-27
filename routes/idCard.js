const express = require('express');
const router = express.Router();
const { showIdCard } = require('../controllers/idCardController');

router.get('/:id', showIdCard);

module.exports = router;
