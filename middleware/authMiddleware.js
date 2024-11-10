const jwt = require("jsonwebtoken");
require("dotenv").config();

// Middleware for token validation
const authenticateToken = (req, res, next) => {
  const authHead = req.headers.authorization;

  if (!authHead || !authHead.startsWith("Bearer ")) {
    return res.status(401).json({ msg: "No token provided" }); // Changed to 401
  }

  const token = authHead.split(" ")[1];

  try {
    const { username, userid } = jwt.verify(token, process.env.JWT_SECRET); // Ensure correct environment variable
    req.user = { username, userid };

    console.log(
      `Authenticated user: ${req.user.username}, ID: ${req.user.userid}`
    );
    next(); // Proceed to the next middleware or route handler
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired. Please log in again." }); // Changed to 401
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." }); // Changed to 401
    } else {
      return res.status(403).json({ message: "Failed to authenticate token." });
    }
  }
};

// Export the middleware for use in routes
module.exports = authenticateToken;
