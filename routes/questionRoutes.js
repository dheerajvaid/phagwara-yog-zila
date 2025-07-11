const express = require("express");
const router = express.Router();
const questionController = require("../controllers/questionController");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { adminOnly } = require("../config/roles");

// Show add question form
router.get(
  "/add",
  requireLogin,
  canManage(adminOnly),
  questionController.getAddQuestionForm
);

// Handle form submission
router.post(
  "/add",
  requireLogin,
  canManage(adminOnly),
  questionController.postAddQuestion
);

router.get(
  "/list",
  requireLogin,
  canManage(adminOnly),
  questionController.getQuestionList
);
router.get(
  "/edit/:id",
  requireLogin,
  canManage(adminOnly),
  questionController.getEditForm
);
router.post(
  "/edit/:id",
  requireLogin,
  canManage(adminOnly),
  questionController.postEditForm
);
router.post(
  "/delete/:id",
  requireLogin,
  canManage(adminOnly),
  questionController.deleteQuestion
);

module.exports = router;
