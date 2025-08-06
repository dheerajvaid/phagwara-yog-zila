// routes/publicExploreRoutes.js

const express = require("express");
const router = express.Router();
const exploreController = require("../controllers/exploreController");

// 🏁 Directory homepage (shows all Prants and Zilas)
router.get("/", exploreController.showExploreHome);

// 🏢 Zila detail page: team + ksheter list
router.get("/zila/:zilaId", exploreController.showZilaDetail);

// 🏠 Ksheter detail page: team + kender list
router.get("/ksheter/:ksheterId", exploreController.showKsheterDetail);

// 🧘‍♂️ Kender detail page: team roles
router.get("/kender/:kenderId", exploreController.showKenderDetail);

// 🔍 Global search page
router.get("/search", exploreController.handleSearchQuery);

module.exports = router;
