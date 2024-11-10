const { StatusCodes } = require("http-status-codes");
const dbConnection = require("../../Database/dbconfig");
const jwt = require("jsonwebtoken");
// SQL Queries
// const INSERT_QUESTION_QUERY =
//   "INSERT INTO questions (userid, title, description, tag) VALUES (?, ?, ?, ?)";
const SELECT_ALL_QUESTIONS_QUERY = `
	SELECT 
		questions.questionid,
		questions.userid,
		questions.title,
		questions.description,
		questions.tag,
		questions.created_at,
		questions.updated_at,
		users.username
	FROM questions
	JOIN users ON questions.userid = users.userid
`;
const SELECT_QUESTION_BY_ID_QUERY = `
	SELECT q.questionid, q.userid, q.title, q.description, q.tag, q.created_at, q.updated_at, u.username
	FROM questions q
	LEFT JOIN users u ON q.userid = u.userid
	WHERE q.questionid = ?
`;
const UPDATE_QUESTION_QUERY = `
	UPDATE questions
	SET title = ?, description = ?, tag = ?, updated_at = CURRENT_TIMESTAMP
	WHERE questionid = ?
`;
const DELETE_QUESTION_QUERY = "DELETE FROM questions WHERE questionid = ?";

// Centralized error handling
const handleError = (res, error, message) => {
  console.error(message, error);
  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ msg: "Something went wrong. Try again." });
};

// @desc    Create a new question
const createQuestion = async (req, res) => {
  const { title, description, tag } = req.body;
  const { userid, username } = req.user;

  // Validate input data
  if (!title || !description || !tag) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Title, description, and tag are required" });
  }

  try {
    // SQL query for inserting a new question
    const INSERT_QUESTION_QUERY = `
      INSERT INTO questions (userid, title, description, tag)
      VALUES (?, ?, ?, ?)
    `;

    // Execute query to insert a new question
    const [result] = await dbConnection.query(INSERT_QUESTION_QUERY, [
      userid,
      title,
      description,
      tag,
    ]);

    // Log and return a success response with question details
    console.log(`Question created successfully ${result}`);
    return res.status(StatusCodes.CREATED).json({
      msg: "Question created successfully",
      question: {
        id: result.insertId,
        title,
        description,
        tag,
        userid,
        username,
      },
    });
  } catch (error) {
    // Handle errors during the database operation
    return handleError(res, error, "Error creating question");
  }
};
// const createQuestion = async (req, res) => {
//   const { title, description, tag } = req.body;

//   // Validate input
//   if (!title || !description || !tag) {
//     return res
//       .status(StatusCodes.BAD_REQUEST)
//       .json({ message: "All fields are required." });
//   }

//   // Check the Authorization header for the token
//   const token = req.headers.authorization?.split(" ")[1];
//   if (!token) {
//     return res
//       .status(StatusCodes.UNAUTHORIZED)
//       .json({ message: "Token is required." });
//   }

//   let userId;
//   try {
//     const decoded = jwt.verify(token, "your_jwt_secret"); // Use your actual JWT secret
//     userId = decoded.userId; // Ensure this matches your token's payload structure
//   } catch (error) {
//     return res
//       .status(StatusCodes.UNAUTHORIZED)
//       .json({ message: "Invalid token." });
//   }

//   try {
//     const result = await dbConnection.query(
//       "INSERT INTO questions (title, description, tag, userId) VALUES (?, ?, ?, ?)",
//       [title, description, tag, userId]
//     );

//     res.status(StatusCodes.CREATED).json({
//       message: "Question created successfully.",
//       questionId: result.insertId,
//     });
//   } catch (error) {
//     console.error("Database error:", error);
//     res
//       .status(StatusCodes.INTERNAL_SERVER_ERROR)
//       .json({ message: "An error occurred while creating the question." });
//   }
// };

// @desc    Get all questions
const getAllQuestions = async (req, res) => {
  try {
    const [questions] = await dbConnection.query(SELECT_ALL_QUESTIONS_QUERY);
    return res.status(StatusCodes.OK).json(questions);
  } catch (error) {
    return handleError(res, error, "Error fetching questions");
  }
};
// Like a question
const createQuestionLike = async (req, res) => {
  const questionId = req.params.questionId;

  try {
    const question = await dbConnection.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    question.like_count += 1;
    await question.save();

    res
      .status(200)
      .json({ message: "Liked successfully", like_count: question.like_count });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Dislike a question
const createQuestionDisLike = async (req, res) => {
  const questionId = req.params.id;

  try {
    const question = await dbConnection.findByPk(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found" });
    }

    question.dislike_count += 1;
    await question.save();

    res.status(200).json({
      message: "Disliked successfully",
      dislike_count: question.dislike_count,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// const getQuestionById = async (req, res) => {
//   try {
//     const question = await dbConnection.findById(req.params.id);
//     if (!question) {
//       return res.status(404).json({ msg: "Question not found" });
//     }
//     res.json(question);
//   } catch (error) {
//     res.status(500).json({ msg: "Server error" });
//   }
// };

//@desc    Get single question by ID
const getQuestionById = async (req, res) => {
  const { questionid } = req.params;

  // Parse question ID to integer
  const id = parseInt(questionid, 10);

  // Check if the questionid is a valid number
  if (isNaN(id)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid question ID format" });
  }

  try {
    // Query the database to find the question by its ID
    const [question] = await dbConnection.query(
      "SELECT * FROM questions WHERE questionid = ?",
      [id]
    );

    // Check if the question exists
    if (question.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Question not found" });
    }

    // Return the question data
    return res.status(StatusCodes.OK).json({
      message: "Question retrieved successfully",
      data: question[0],
    });
  } catch (error) {
    // Handle server errors
    console.error("Error retrieving question:", error);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong. Try again." });
  }
};

// @desc    Update a question
const updateQuestion = async (req, res) => {
  const { questionid } = req.params;
  const { title, description, tag } = req.body;
  const id = parseInt(questionid, 10);

  if (isNaN(id)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid question ID format" });
  }

  if (!title || !description || !tag) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Title, description, and tag are required" });
  }

  try {
    const [question] = await dbConnection.query(SELECT_QUESTION_BY_ID_QUERY, [
      id,
    ]);
    if (question.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Question not found" });
    }

    if (question[0].userid !== req.user.userid) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: "You do not have permission to update this question",
      });
    }

    const [result] = await dbConnection.query(UPDATE_QUESTION_QUERY, [
      title,
      description,
      tag,
      id,
    ]);
    if (result.affectedRows > 0) {
      res.json({ message: "Question updated successfully" });
    } else {
      res.status(StatusCodes.NOT_FOUND).json({ message: "Question not found" });
    }
  } catch (error) {
    return handleError(
      res,
      error,
      "Database query error while updating question"
    );
  }
};

// @desc    Delete a question
const deleteQuestion = async (req, res) => {
  const { questionid } = req.params;
  const id = parseInt(questionid, 10);

  if (isNaN(id)) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ message: "Invalid question ID format" });
  }

  try {
    const [question] = await dbConnection.query(SELECT_QUESTION_BY_ID_QUERY, [
      id,
    ]);
    if (question.length === 0) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ message: "Question not found" });
    }

    if (question[0].userid !== req.user.userid) {
      return res.status(StatusCodes.FORBIDDEN).json({
        message: "You do not have permission to delete this question",
      });
    }

    const [result] = await dbConnection.query(DELETE_QUESTION_QUERY, [id]);
    if (result.affectedRows > 0) {
      res.json({ message: "Question deleted successfully" });
    } else {
      res.status(StatusCodes.NOT_FOUND).json({ message: "Question not found" });
    }
  } catch (error) {
    return handleError(
      res,
      error,
      "Database query error while deleting question"
    );
  }
};

module.exports = {
  createQuestion,
  createQuestionLike,
  createQuestionDisLike,
  getAllQuestions,
  getQuestionById,
  updateQuestion,
  deleteQuestion,
};
