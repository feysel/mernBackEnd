const express = require("express");
const router = express.Router();

// Importing user controllers
const {
  register,
  login,
  checkUser,
  logoutUser,
  updateProfile,
} = require("../Controller/user/userController");

// Importing authentication middleware
const authMiddleware = require("../middleware/authMiddleware");

// Register route
router.post("/register", register);

// Login route
router.post("/login", login);

// Logout route
router.post("/logout", logoutUser);

// Check user route for authentication
//router.get("/check", authMiddleware, checkUser);
router.get("/checkuser", authMiddleware, checkUser); // Protect the 'check' route
// Route for updating user profile
router.put("/profile", authMiddleware, updateProfile);

module.exports = router;
