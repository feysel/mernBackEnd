const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser");
const helmet = require("helmet");
const morgan = require("morgan");
const userRoutes = require("./routes/UsersRoute");
const questionsRoutes = require("./routes/questionRoute");
const answersRoutes = require("./routes/answerRoute");
const startServer = require("./startServer");
require("dotenv").config();

// Validate environment variables
const PORT = process.env.PORT || 3003;
// if (!process.env.ALLOWED_ORIGINS) {
//   console.error(
//     "Error: ALLOWED_ORIGINS is not defined in the environment variables"
//   );
//   process.exit(1);
// }

// Initialize Express app
const app = express();

// Middleware setup
app.use(helmet());
app.use(morgan("combined")); // Logs incoming requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// CORS setup
// // CORS setup
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
app.use(cors(corsOptions));
app.use(express.json());
app.use(bodyParser.json());
app.use(cors(corsOptions));

// Custom error handling for CORS
app.use((err, req, res, next) => {
  if (err.message === "CORS error: Not allowed by CORS") {
    return res.status(403).json({ message: err.message });
  }
  next(err);
});

const authMiddleware = require("./middleware/authMiddleware");
// Define routes

app.use("/api/users", userRoutes);
app.use("/api/questions", authMiddleware, questionsRoutes); // This will handle question-related routes
app.use("/api/answers", authMiddleware, answersRoutes); //// This will handle answer-related routes

// Rest of your logic
// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res
    .status(500)
    .json({ message: "Internal server error", error: err.message });
});

// Graceful shutdown function
const gracefulShutdown = () => {
  console.log("Shutting down server gracefully...");
  process.exit(0);
};

// Start server
startServer(app, PORT);

// Graceful shutdown handling
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);
