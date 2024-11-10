const express = require("express");
const router = express.Router();

//const authMiddleware = require("../middleware/authMiddleware");
const {
  createQuestion,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
  createQuestionLike,
  createQuestionDisLike,
} = require("../Controller/question/questionController");

// @desc    Create a new question
// @route   POST /api/questions/askquestion
// @access  Private
router.post("/create", createQuestion);
// @desc    Get all questions
// @route   GET /api/questions
// @access  Public
router.get("/all", getAllQuestions);
router.post("/like/:questionid/like", createQuestionLike);
// @desc    Get single question by ID
// @route   GET /api/questions/:questionid
// @access  Public
router.post("/like/:questionid/dislike", createQuestionDisLike);
router.get("/:questionid", getQuestionById);

// @desc    Update a question
// @route   PUT /api/questions/:questionid
// @access  Private
router.put("/:questionid", updateQuestion);

// @desc    Delete a question
// @route   DELETE /api/questions/:questionid
// @access  Private
router.delete("/:questionid", deleteQuestion);

module.exports = router;
