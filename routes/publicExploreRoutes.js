// routes/publicExploreRoutes.js

const express = require("express");
const router = express.Router();
const exploreController = require("../controllers/exploreController");
const { requireLogin } = require("../middleware/authMiddleware");
const {
  adminRoles,
  prantRoles,
  zilaRoles,
  ksheterRoles,
  kenderRoles,
} = require("../config/roles");
const { canManage } = require("../middleware/roleMiddleware");

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

router.get("/excel", exploreController.exportExploreExcel);

router.get(
  "/word/form",
  requireLogin,
  canManage([
    ...adminRoles,
    ...prantRoles,
    ...zilaRoles,
    ...ksheterRoles,
    ...kenderRoles,
  ]),
  exploreController.showExportForm
);
router.get(
  "/word",
  requireLogin,
  canManage([
    ...adminRoles,
    ...prantRoles,
    ...zilaRoles,
    ...ksheterRoles,
    ...kenderRoles,
  ]),
  exploreController.exportDirectoryWord
);

router.get(
  "/summary/view",
  requireLogin,
  canManage([...adminRoles, ...prantRoles, ...zilaRoles, ...ksheterRoles]),
  exploreController.showExploreSummaryView
);
router.get("/summary/pdf", exploreController.exportSummaryPDF);
router.get("/summary/excel", exploreController.exportSummaryExcel);

module.exports = router;
