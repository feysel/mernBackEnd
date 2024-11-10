const { StatusCodes } = require("http-status-codes");
const dbConnection = require("../../Database/dbconfig");

// SQL Queries
const INSERT_ANSWER_QUERY =
  "INSERT INTO answers (userid, questionid, answer) VALUES (?, ?, ?)";

const RETRIEVE_ALL_ANSWER_QUERY = "SELECT * FROM answers  ";

const SELECT_ANSWERS_BY_QUESTION_QUERY = `
  SELECT a.*, u.username 
  FROM answers a
  JOIN users u ON a.userid = u.userid
  WHERE a.questionid = ?
`;
const SELECT_ANSWER_BY_ID_QUERY = `
  SELECT a.answerid, a.answer, a.questionid, a.created_at, a.updated_at, 
         u.userid as userId, u.username as userName 
  FROM answers a 
  JOIN users u ON a.userid = u.userid 
  WHERE a.answerid = ?
`;
const UPDATE_ANSWER_QUERY = `
  UPDATE answers SET answer = ? WHERE answerid = ? AND userid = ?
`;
const DELETE_ANSWER_QUERY = `
  DELETE FROM answers WHERE answerid = ? AND userid = ?
`;

// Centralized error handling
const handleError = (res, error, message) => {
  console.error(message, error);
  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ msg: "An internal error occurred. Please try again later." });
};

// Helper function to find an answer by ID its benefit of DRY[dont repeate your selfe ] rule
const findAnswerById = async (answerId) => {
  const [answer] = await dbConnection.query(SELECT_ANSWER_BY_ID_QUERY, [
    answerId,
  ]);
  return answer[0]; // Return the first answer object, if exists
};

// @desc    Create a new answer
const createAnswer = async (req, res) => {
  const { questionid } = req.params; // // Get questionId from URL
  const { answer } = req.body; //// Get answer text from request body
  const { userid } = req.user; //// Assuming authentication is in place

  // Validate input
  if (!answer || !questionid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Question ID and answer text are required" });
  }

  try {
    // Insert new answer
    const [result] = await dbConnection.query(INSERT_ANSWER_QUERY, [
      userid,
      questionid,
      answer,
    ]);

    // Retrieve the newly created answer
    const newAnswer = await findAnswerById(result.insertid);

    return res.status(StatusCodes.CREATED).json({
      msg: "Answer created successfully",
      answer: newAnswer,
    });
  } catch (error) {
    return handleError(res, error, "Error creating answer");
  }
};
// Controller function to get all answers for a specific question
const getAllAnswers = async (req, res) => {
  const { questionid } = req.params;

  try {
    // Find all answers where the questionid matches the one in the request
    const answers = await dbConnection.query(RETRIEVE_ALL_ANSWER_QUERY, [
      questionid,
    ]);
    console.log(answers[0]);

    // If no answers found
    if (!answers || answers.length === 0) {
      return res
        .status(404)
        .json({ message: "No answers found for this question." });
    }

    // Send the list of answers back to the client
    res.status(200).json(answers[0]);
  } catch (error) {
    // Handle errors (e.g., database errors)
    res.status(500).json({ message: "Error retrieving answers.", error });
  }
};
// @desc    Get answers for a specific question
const getAnswerByQuestionId = async (req, res) => {
  const questionid = req.params.questionid;

  // Validate question ID
  if (!questionid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Question ID is required" });
  }

  try {
    const [answers] = await dbConnection.query(
      SELECT_ANSWERS_BY_QUESTION_QUERY,
      [questionid]
    );

    if (answers.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "No answers found for this question" });
    }

    return res.status(StatusCodes.OK).json({
      msg: "Answers retrieved successfully",
      answers,
    });
  } catch (error) {
    return handleError(res, error, "Error fetching answers");
  }
};

// @desc    Update an answer
const updateAnswer = async (req, res) => {
  const { answerid } = req.params;
  const { answer } = req.body;
  const { userid } = req.user;

  // Validate input
  if (!answer || !answerid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Answer ID and answer text are required" });
  }

  try {
    // Update answer in the database
    const [updateResult] = await dbConnection.query(UPDATE_ANSWER_QUERY, [
      answer,
      answerid,
      userid,
    ]);

    if (updateResult.affectedRows === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "Answer not found or you are not authorized to update this answer",
      });
    }

    // Retrieve updated answer
    const updatedAnswer = await findAnswerById(answerid);

    return res.status(StatusCodes.OK).json({
      msg: "Answer updated successfully",
      answer: updatedAnswer,
    });
  } catch (error) {
    return handleError(res, error, "Error updating answer");
  }
};

// @desc    Delete an answer
const deleteAnswer = async (req, res) => {
  const { answerid } = req.params;
  const { userid } = req.user;

  if (!answerid) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Answer ID is required" });
  }

  try {
    const answerDetails = await findAnswerById(answerid);

    if (!answerDetails) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ msg: "Answer not found" });
    }

    // Perform the deletion
    const [result] = await dbConnection.query(DELETE_ANSWER_QUERY, [
      answerid,
      userid,
    ]);

    if (result.affectedRows === 0) {
      return res.status(StatusCodes.NOT_FOUND).json({
        msg: "Answer not found or you are not authorized to delete this answer",
      });
    }

    return res.status(StatusCodes.OK).json({
      msg: "Answer deleted successfully",
      deletedAnswer: answerDetails,
    });
  } catch (error) {
    return handleError(res, error, "Error deleting answer");
  }
};

module.exports = {
  createAnswer,
  getAllAnswers,
  getAnswerByQuestionId,
  updateAnswer,
  deleteAnswer,
};
