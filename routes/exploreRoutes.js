const express = require('express');
const router = express.Router();
const exploreController = require('../controllers/exploreController');

router.get('/explore', exploreController.showExploreHome);
router.get('/explore/zila/:id', exploreController.showZilaDetails);
router.get('/explore/ksheter/:id', exploreController.showKsheterDetails);
router.get('/explore/kender/:id', exploreController.showKenderDetails);


module.exports = router;
