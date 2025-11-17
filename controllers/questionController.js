const Question = require("../models/Question");

// Render the form to add a new question
exports.getAddQuestionForm = async (req, res) => {
  const categories = await Question.distinct("category"); // unique list

  res.render("question/add", {
    categories,
    title: "Add New Question",
  });
};

// Handle form submission and save question to database
exports.postAddQuestion = async (req, res) => {
  try {
    let { text, options, correctAnswers, category, contributedBy } = req.body;

    // Basic input validation
    if (!text || !category || !options || !correctAnswers) {
      return res.status(400).send("All fields are required.");
    }

    // Normalize options and correct answers
    options = Array.isArray(options)
      ? options.map((opt) => opt.trim())
      : [options.trim()];
    correctAnswers = Array.isArray(correctAnswers)
      ? correctAnswers.map(Number)
      : [Number(correctAnswers)];

    // Ensure exactly 4 options and at least 1 correct answer
    if (options.length !== 4 || correctAnswers.length < 1) {
      return res
        .status(400)
        .send("Please provide 4 options and at least 1 correct answer.");
    }

    // Create new question document
    const question = new Question({
      text: text.trim(),
      options,
      correctAnswers,
      category: category.trim(),
      contributedBy: {
        name: contributedBy?.name?.trim() || "",
        designation: contributedBy?.designation?.trim() || "",
      },
    });
    await question.save();

    // Redirect to question list page
    res.redirect("/question/list");
  } catch (err) {
    console.error("Error saving question:", err);
    res.status(500).send("Internal server error.");
  }
};

// Show all questions
exports.getQuestionList = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 20;
    const skip = (page - 1) * limit;

    const searchQuery = req.query.search?.trim() || "";
    const sortField = req.query.sort || "_id";

    const searchFilter = {
      $or: [
        { text: new RegExp(searchQuery, "i") },
        { category: new RegExp(searchQuery, "i") },
        { options: { $elemMatch: { $regex: new RegExp(searchQuery, "i") } } },
        { "contributedBy.name": new RegExp(searchQuery, "i") },
        { "contributedBy.designation": new RegExp(searchQuery, "i") },
      ],
    };

    const total = await Question.countDocuments(searchFilter);
    const questions = await Question.find(searchFilter)
      .sort({ [sortField]: 1 })
      .skip(skip)
      .limit(limit);

    res.render("question/list", {
      title: "All Questions",
      questions,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      searchQuery,
      sortField,
    });
  } catch (err) {
    console.error("Error fetching questions:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Edit form
exports.getEditForm = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    const categories = await Question.distinct("category");

    if (!question) return res.status(404).send("Question not found");
    res.render("question/edit", {
      categories,
      title: "Edit Question",
      question,
    });
  } catch (err) {
    console.error("Error fetching question:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Save edited question
exports.postEditForm = async (req, res) => {
  try {
    let { text, options, correctAnswers, category, contributedBy } = req.body;

    options = Array.isArray(options)
      ? options.map((opt) => opt.trim())
      : [options.trim()];
    correctAnswers = Array.isArray(correctAnswers)
      ? correctAnswers.map(Number)
      : [Number(correctAnswers)];

    await Question.findByIdAndUpdate(req.params.id, {
      text: text.trim(),
      options,
      correctAnswers,
      category: category.trim(),
      contributedBy: {
        name: contributedBy?.name?.trim() || "",
        designation: contributedBy?.designation?.trim() || "",
      },
    });

    res.redirect("/question/list");
  } catch (err) {
    console.error("Error updating question:", err);
    res.status(500).send("Internal Server Error");
  }
};

// Delete question
exports.deleteQuestion = async (req, res) => {
  try {
    await Question.findByIdAndDelete(req.params.id);
    res.redirect("/question/list");
  } catch (err) {
    console.error("Error deleting question:", err);
    res.status(500).send("Internal Server Error");
  }
};
