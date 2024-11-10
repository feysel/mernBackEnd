const express = require("express");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const userRoutes = require("./routes/UsersRoute");
const questionsRoutes = require("./routes/questionRoute");
const answersRoutes = require("./routes/answerRoute");
const startServer = require("./startServer");
const notFound = require("./notFound");
const errorHandler = require("./errorHandler");

require("dotenv").config();
const serverless = require("serverless-http"); // Add this
// Validate environment variables
const PORT = process.env.PORT || 3000;
if (!process.env.ALLOWED_ORIGINS) {
  console.error(
    "Error: ALLOWED_ORIGINS is not defined in the environment variables"
  );
  process.exit(1);
}

// Initialize Express app
const app = express();

// Middleware setup
app.use(helmet());
app.use(morgan("combined")); // Logs incoming requests
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// CORS setup
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");
const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error("CORS error: Not allowed by CORS"));
    }
  },
  credentials: true,
};
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
app.use("/api/questions", authMiddleware, questionsRoutes);
app.use("/api/answers", authMiddleware, answersRoutes);

app.get("/api/", (req, res) => {
  res.json({ message: "Hellow World From BackEnd!!" });
});
app.use(notFound);
app.use(errorHandler);
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

// Start the Express app for local dev, but for Vercel we export the handler
if (require.main === module) {
  startServer(app, PORT);
}

// Graceful shutdown handling
process.on("SIGTERM", gracefulShutdown);
process.on("SIGINT", gracefulShutdown);

// Export handler for Vercel serverless function
module.exports = serverless(app);

// const express = require("express");
// const cookieParser = require("cookie-parser");
// const cors = require("cors");
// const helmet = require("helmet");
// const morgan = require("morgan");
// const userRoutes = require("./routes/UsersRoute");
// const questionsRoutes = require("./routes/questionRoute");
// const answersRoutes = require("./routes/answerRoute");
// const startServer = require("./startServer");
// require("dotenv").config();

// // Validate environment variables
// const PORT = process.env.PORT || 3000;
// if (!process.env.ALLOWED_ORIGINS) {
//   console.error(
//     "Error: ALLOWED_ORIGINS is not defined in the environment variables"
//   );
//   process.exit(1);
// }

// // Initialize Express app
// const app = express();

// // Middleware setup
// app.use(helmet());
// app.use(morgan("combined")); // Logs incoming requests
// app.use(express.urlencoded({ extended: true }));
// app.use(express.json());
// app.use(cookieParser());

// // CORS setup
// const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");
// const corsOptions = {
//   origin: (origin, callback) => {
//     if (allowedOrigins.includes(origin) || !origin) {
//       callback(null, true);
//     } else {
//       callback(new Error("CORS error: Not allowed by CORS"));
//     }
//   },
//   credentials: true,
// };
// app.use(cors(corsOptions));

// // Custom error handling for CORS
// app.use((err, req, res, next) => {
//   if (err.message === "CORS error: Not allowed by CORS") {
//     return res.status(403).json({ message: err.message });
//   }
//   next(err);
// });

// const authMiddleware = require("./middleware/authMiddleware");
// // Define routes

// app.use("/api/users", userRoutes);
// app.use("/api/questions", authMiddleware, questionsRoutes); // This will handle question-related routes
// app.use("/api/answers", authMiddleware, answersRoutes); //// This will handle answer-related routes

// // Rest of your logic
// // Error handling middleware
// app.use((err, req, res, next) => {
//   console.error(err.stack);
//   res
//     .status(500)
//     .json({ message: "Internal server error", error: err.message });
// });

// // Graceful shutdown function
// const gracefulShutdown = () => {
//   console.log("Shutting down server gracefully...");
//   process.exit(0);
// };

// // Start server
// startServer(app, PORT);

// // Graceful shutdown handling
// process.on("SIGTERM", gracefulShutdown);
// process.on("SIGINT", gracefulShutdown);
