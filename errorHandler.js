const errorHandler = (err, req, res, next) => {
  console.error(err.stack); // Log the error stack trace for debugging

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack } : {}), // Show stack in dev mode
  });
};

module.exports = errorHandler;