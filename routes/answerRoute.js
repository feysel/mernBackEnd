const express = require("express");
const route = express.Router();
const {
  createAnswer,
  getAllAnswers,
  getAnswerByQuestionId,
  updateAnswer,
  deleteAnswer,
} = require("../Controller/answer/answerController");
//const authMiddleware = require("../middleware/authMiddleware");

// @desc    Create an answer
// @route   POST /api/questions/:questionId/answers
// @access  Private
// Route to create an answer for a specific question
// Create an answer for a specific question (POST)
route.post("/questions/:questionid/create", createAnswer);

// Get answers for a specific question (GET)
route.get("/all", getAllAnswers);

// @desc    Get answers by question ID
// @route   GET /api/questions/:questionId/answers
// @access  Private
// Apply authentication middleware to routes that need authentication
route.get("/:questionid", getAnswerByQuestionId);
//route.get("/questions/:questionid/get_answer", getAnswerByQuestionId);
// @desc    Update an answer
// @route   PUT /api/questions/:questionId/answers/:answerId
// @access  Private
route.put("/:answerid", updateAnswer);

// @desc    Delete an answer
// @route   DELETE /api/questions/:questionId/answers/:answerId
// @access  Private
route.delete("/:answerid", deleteAnswer);

module.exports = route;
