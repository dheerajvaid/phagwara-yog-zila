const express = require("express");
const router = express.Router();
const questionController = require("../controllers/questionController");
const { requireLogin } = require("../middleware/authMiddleware");
const { canManage } = require("../middleware/roleMiddleware");
const { adminRoles, prantRoles, zilaRoles } = require("../config/roles");
const questionRoles = [...adminRoles, ...prantRoles, ...zilaRoles];

// Show add question form
router.get(
  "/add",
  requireLogin,
  canManage(questionRoles),
  questionController.getAddQuestionForm
);

// Handle form submission
router.post(
  "/add",
  requireLogin,
  canManage(questionRoles),
  questionController.postAddQuestion
);

router.get(
  "/list",
  requireLogin,
  canManage(questionRoles),
  questionController.getQuestionList
);
router.get(
  "/edit/:id",
  requireLogin,
  canManage(questionRoles),
  questionController.getEditForm
);
router.post(
  "/edit/:id",
  requireLogin,
  canManage(questionRoles),
  questionController.postEditForm
);
router.post(
  "/delete/:id",
  requireLogin,
  canManage(questionRoles),
  questionController.deleteQuestion
);

module.exports = router;
