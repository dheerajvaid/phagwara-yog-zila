const Question = require("../models/Question");
const { v4: uuidv4 } = require("uuid");

// Temporary in-memory session storage
const quizSessions = {};

exports.getStartForm = async (req, res) => {
  const categories = await Question.distinct("category");
  res.render("quiz/start", {
    title: "Start Quiz",
    categories,
  });
};

exports.postStartQuiz = async (req, res) => {
  const { numQuestions, categories } = req.body;
  const count = Math.min(Math.max(parseInt(numQuestions), 5), 20);

  const filter = Array.isArray(categories)
    ? { category: { $in: categories } }
    : { category: categories };

  const questions = await Question.aggregate([
    { $match: filter },
    { $sample: { size: count } }, // Randomly pick questions
  ]);

  const sessionId = uuidv4();
  quizSessions[sessionId] = {
    questions,
    answers: Array(questions.length).fill(null),
    currentIdx: 0,
  };

  res.redirect(`/quiz/${sessionId}`);
};

exports.getQuizPage = (req, res) => {
  const { sessionId } = req.params;
  const idx = parseInt(req.query.idx || 0);

  const session = quizSessions[sessionId];
  if (!session) return res.status(404).send("Quiz session not found");

  const { questions, answers } = session;

  if (idx < 0 || idx >= questions.length) {
    return res.redirect(`/quiz/${sessionId}?idx=0`);
  }

  res.render("quiz/page", {
    title: `Question ${idx + 1}`,
    sessionId,
    current: idx,
    total: questions.length,
    question: questions[idx],
    selectedAnswer: answers[idx],
  });
};

exports.postAnswer = (req, res) => {
  const { sessionId } = req.params;
  const idx = parseInt(req.query.idx || 0);

  const session = quizSessions[sessionId];
  if (!session) return res.status(404).send("Quiz session not found");

  // ✅ Handle both regular and final answer submission
  const raw = req.body?.answer ?? req.body?.finalAnswer ?? null;
  // console.log("Submitted answer:", raw);

  let normalizedAnswer = null;

  if (Array.isArray(raw)) {
    normalizedAnswer = raw.map((val) => Number(val));
  } else if (typeof raw === "string" && raw.includes(",")) {
    normalizedAnswer = raw.split(",").map((val) => Number(val));
  } else if (raw !== null && raw !== "") {
    normalizedAnswer = Number(raw);
  }

  session.answers[idx] = normalizedAnswer;

  const next = idx + 1;
  if (next < session.questions.length) {
    res.redirect(`/quiz/${sessionId}?idx=${next}`);
  } else {
    // ✅ Final redirect on last question
    res.redirect(`/quiz/${sessionId}/submit`);
  }
};

exports.submitQuiz = (req, res) => {
  const { sessionId } = req.params;
  const session = quizSessions[sessionId];
  if (!session) return res.status(404).send("Quiz session not found");

  const { questions, answers } = session;

  let correct = 0;
  const wrongDetails = [];

  questions.forEach((q, i) => {
    const userAns = answers[i];

    if (userAns === null || userAns === undefined) {
      wrongDetails.push({
        question: q.text,
        options: q.options,
        userAns: [], // ✅ No answer case
        correctAns: q.correctAnswers,
      });
      return;
    }

    const submittedAns = Array.isArray(userAns)
      ? userAns.map(Number)
      : [Number(userAns)];

    const correctAns = q.correctAnswers;

    const isCorrect =
      submittedAns.length === correctAns.length &&
      submittedAns.every((val) => correctAns.includes(val)) &&
      correctAns.every((val) => submittedAns.includes(val)); // ✅ Strict match

    if (isCorrect) {
      correct++;
    } else {
      wrongDetails.push({
        question: q.text,
        options: q.options,
        userAns: submittedAns,
        correctAns,
      });
    }
  });

  const result = {
    total: questions.length,
    correct,
    wrong: questions.length - correct,
    wrongDetails,
  };

  delete quizSessions[sessionId]; // ✅ Cleanup

  res.render("quiz/result", {
    title: "Your Quiz Result",
    result,
  });
};

const PDFDocument = require("pdfkit");
const path = require("path");
const archiver = require("archiver");

exports.printQuiz = async (req, res) => {
  try {
    const { numQuestions, categories } = req.body;
    const count = Math.min(Math.max(parseInt(numQuestions) || 5, 5), 20);

    const filter = Array.isArray(categories)
      ? { category: { $in: categories } }
      : categories
      ? { category: categories }
      : {};

    const questions = await Question.aggregate([
      { $match: filter },
      { $sample: { size: count } }
    ]);

    // ---------------------------
    // 1️⃣ Generate QUESTION PAPER
    // ---------------------------
    const qBuffer = await createQuestionPDF(questions);

    // ---------------------------
    // 2️⃣ Generate ANSWER KEY
    // ---------------------------
    const aBuffer = await createAnswerPDF(questions);

    // ---------------------------
    // 3️⃣ Create ZIP & Send
    // ---------------------------
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="quiz_package.zip"`
    );
    res.setHeader("Content-Type", "application/zip");

    const archive = archiver("zip");
    archive.pipe(res);

    archive.append(qBuffer, { name: "quiz-paper.pdf" });
    archive.append(aBuffer, { name: "quiz-answer-key.pdf" });

    archive.finalize();
  } catch (err) {
    console.error("PDF ZIP generation error:", err);
    res.status(500).send("Error generating Quiz ZIP");
  }
};

// ----------------------------------------
// Helper function: QUESTION PDF buffer
// ----------------------------------------
function createQuestionPDF(questions) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const fontRegular = path.join(
      __dirname,
      "..",
      "fonts",
      "NotoSansDevanagari-Regular.ttf"
    );
    const fontBold = path.join(
      __dirname,
      "..",
      "fonts",
      "NotoSansDevanagari-Bold.ttf"
    );

    try {
      doc.registerFont("Hindi", fontRegular);
      doc.registerFont("Hindi-Bold", fontBold);
      doc.font("Hindi");
    } catch {}

    // HEADER
    doc.font("Hindi-Bold").fontSize(20).text("Bharatiya Yog Sansthan", { align: "center" });
    doc.moveDown(0.2);
    doc.font("Hindi").fontSize(14).text("Yoga Quiz – Question Paper", { align: "center" });
    doc.moveDown(1);

    // Questions
    questions.forEach((q, i) => {
      doc.fontSize(13).text(`${i + 1}. ${q.text}`, { lineGap: 3 });
      doc.moveDown(0.2);

      (q.options || []).forEach((opt) => {
        doc.fontSize(12).text(`☐ ${opt}`, { indent: 20 });
      });

      doc.moveDown(0.6);

      if (doc.y > 750) doc.addPage();
    });

    doc.end();
  });
}

// ----------------------------------------
// Helper function: ANSWER KEY PDF buffer
// ----------------------------------------
function createAnswerPDF(questions) {
  return new Promise((resolve) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks = [];

    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));

    const fontRegular = path.join(
      __dirname,
      "..",
      "fonts",
      "NotoSansDevanagari-Regular.ttf"
    );
    const fontBold = path.join(
      __dirname,
      "..",
      "fonts",
      "NotoSansDevanagari-Bold.ttf"
    );

    try {
      doc.registerFont("Hindi", fontRegular);
      doc.registerFont("Hindi-Bold", fontBold);
      doc.font("Hindi");
    } catch {}

    doc.font("Hindi-Bold").fontSize(20).text("Bharatiya Yog Sansthan", { align: "center" });
    doc.moveDown(0.2);
    doc.font("Hindi").fontSize(14).text("Yoga Quiz – Answer Sheet", { align: "center" });
    doc.moveDown(1);

    questions.forEach((q, i) => {
      doc.font("Hindi-Bold").fontSize(13).text(`${i + 1}. ${q.text}`);
      doc.moveDown(0.2);

      (q.correctAnswers || []).forEach((ansIndex) => {
        const correct = q.options?.[ansIndex] || "";
        doc.font("Hindi").fontSize(12).text(`${correct}`, { indent: 25 });
      });

      doc.moveDown(0.6);

      if (doc.y > 750) doc.addPage();
    });

    doc.end();
  });
}
