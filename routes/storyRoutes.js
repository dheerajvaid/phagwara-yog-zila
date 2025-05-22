const express = require("express");
const router = express.Router();
const storyController = require("../controllers/storyController");
const { ksheterRoles } = require("../config/roles");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");

router.get("/", storyController.listStories);
router.get("/view/:id", storyController.viewStory);

router.get(
  "/new",
  requireLogin,
  canManage(ksheterRoles),
  storyController.newStoryForm
);
router.post(
  "/new",
  requireLogin,
  canManage(ksheterRoles),
  storyController.createStory
);

router.get(
  "/edit/:id",
  requireLogin,
  canManage(ksheterRoles),
  storyController.editStoryForm
);
router.post(
  "/edit/:id",
  requireLogin,
  canManage(ksheterRoles),
  storyController.updateStory
);

router.post(
  "/delete/:id",
  requireLogin,
  canManage(ksheterRoles),
  storyController.deleteStory
);

module.exports = router;
