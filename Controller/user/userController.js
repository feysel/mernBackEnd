const bcrypt = require("bcrypt");
const { StatusCodes } = require("http-status-codes");
const dbConnection = require("../../Database/dbconfig");
const generateToken = require("../../tokens/generateToken");
require("dotenv").config();
const jwt = require("jsonwebtoken");
// Centralized error handling
const handleError = (res, error, message) => {
  console.error(message, error);
  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ msg: "Something went wrong. Try again." });
};

// Register a user
const register = async (req, res) => {
  console.log("Request Body:", req.body); // Log incoming request data

  const { username, firstname, lastname, email, password } = req.body;

  // Validate required fields
  if (!email || !password || !firstname || !lastname || !username) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please provide all required information" });
  }

  try {
    // Check for existing users
    const [existingUsers] = await dbConnection.query(
      "SELECT username, userid FROM users WHERE username = ? OR email = ?",
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "User already registered!" });
    }

    // Validate password format
    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        msg: "Password must be at least 8 characters long and include letters, numbers, and special characters.",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(
      password,
      await bcrypt.genSalt(10)
    );

    // Insert the new user
    const [result] = await dbConnection.query(
      "INSERT INTO users (username, firstname, lastname, email, password) VALUES (?, ?, ?, ?, ?)",
      [username, firstname, lastname, email, hashedPassword]
    );

    generateToken(res, username, result.insertId);
    return res.status(StatusCodes.CREATED).json({
      msg: "User account created successfully",
      userId: result.insertId,
    });
  } catch (error) {
    // Ensure no headers are sent after response
    if (!res.headersSent) {
      return handleError(res, error, "Error during user registration");
    }
  }
};

// Login a user
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: "Please fill all fields." });
  }

  try {
    const [user] = await dbConnection.query(
      "SELECT `userid`, `username`, `password` FROM `users` WHERE `email` = ?",
      [email]
    );
    console.log(user);
    if (user.length == 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Invalid account or not registered." });
    }

    // Comparing password
    const isSame = await bcrypt.compare(password, user[0].password); // Use the correct column here
    if (!isSame) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "Invalid password." });
    }

    // Signing the token
    const username = user[0].username;
    const userid = user[0].userid;
    const token = jwt.sign(
      { username: username, userid: userid },
      process.env.JWT_SECRET,
      { expiresIn: "40d" }
    );

    return res
      .status(StatusCodes.OK)
      .json({ msg: "Logged in successfully.", token, username });
  } catch (error) {
    console.error("Login error:", error.message);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ msg: "Something went wrong." });
  }
};

// // Assuming generateToken is defined like this
// const generateToken = (username, userid) => {
//   // Logic to generate a token
//   // Return the token instead of sending a response
//   return token; // Replace this with actual token generation logic
// };

// Logout user
const logoutUser = (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // Change to "production" for production
    sameSite: "strict",
    maxAge: 0,
  });
  return res
    .status(StatusCodes.OK)
    .json({ msg: "User logged out successfully" });
};

// Get user info
const checkUser = (req, res) => {
  const { username, userid } = req.user;
  return res
    .status(StatusCodes.OK)
    .json({ msg: "Valid user", username, userid });
};

// Update a user
const updateProfile = async (req, res) => {
  const userId = req.user.userid;
  const {
    username,
    firstname,
    lastname,
    email,
    currentPassword,
    newPassword,
    retypeNewPassword,
  } = req.body;

  try {
    const updateFields = [];
    const values = [];

    // Check if the username is already taken
    if (username) {
      const [usernameExists] = await dbConnection.query(
        "SELECT * FROM users WHERE username = ? AND userid != ?",
        [username, userId]
      );
      if (usernameExists.length > 0) {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ msg: "Username already exists" });
      }
      updateFields.push("username = ?");
      values.push(username);
    }

    // Check if the email is already taken
    if (email) {
      const [emailExists] = await dbConnection.query(
        "SELECT * FROM users WHERE email = ? AND userid != ?",
        [email, userId]
      );
      if (emailExists.length > 0) {
        return res
          .status(StatusCodes.CONFLICT)
          .json({ msg: "Email already exists" });
      }
      updateFields.push("email = ?");
      values.push(email);
    }

    // Add other fields to update
    if (firstname) {
      updateFields.push("firstname = ?");
      values.push(firstname);
    }
    if (lastname) {
      updateFields.push("lastname = ?");
      values.push(lastname);
    }

    // Handle password updates
    if (currentPassword || newPassword || retypeNewPassword) {
      if (!currentPassword || !newPassword || !retypeNewPassword) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          msg: "To change the password, provide current password, new password, and retype new password",
        });
      }
      if (newPassword.length < 8) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ msg: "New password must be longer than 8 characters" });
      }
      if (newPassword !== retypeNewPassword) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ msg: "New password and retype new password do not match" });
      }

      const [user] = await dbConnection.query(
        "SELECT password FROM users WHERE userid = ?",
        [userId]
      );
      if (!user || user.length === 0) {
        return res
          .status(StatusCodes.NOT_FOUND)
          .json({ msg: "User not found" });
      }

      const validPassword = await bcrypt.compare(
        currentPassword,
        user[0].password
      );
      if (!validPassword) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ msg: "Current password is incorrect" });
      }

      const hashedPassword = await bcrypt.hash(
        newPassword,
        await bcrypt.genSalt(10)
      );
      updateFields.push("password = ?");
      values.push(hashedPassword);
    }

    // If no fields to update
    if (updateFields.length === 0) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ msg: "No updates were made" });
    }

    // Build and execute the update query
    const query = `UPDATE users SET ${updateFields.join(
      ", "
    )} WHERE userid = ?`;
    values.push(userId);
    await dbConnection.query(query, values);

    return res
      .status(StatusCodes.OK)
      .json({ msg: "Profile updated successfully" });
  } catch (error) {
    return handleError(res, error, "Error while updating the profile");
  }
};

module.exports = { register, login, logoutUser, checkUser, updateProfile };
