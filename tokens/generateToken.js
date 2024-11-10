require("dotenv").config();
const jwt = require("jsonwebtoken");

// Function to generate token and set it in a cookie
const generateToken = (res, username, userid) => {
  // Check for the presence of the JWT secret
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined in the environment variables");
  }

  // Generate JWT token
  const token = jwt.sign({ username, userid }, process.env.JWT_SECRET, {
    expiresIn: "30d", // Token expiration set to 30 days (can be shortened for better security)
  });

  // Generate JWT token

  // Send the token in the response
  res.json({ token });
  //return token;
  // Log success message

  // // Set the token as a cookie
  // res.cookie("token", token, {
  //   httpOnly: true, // Prevents client-side scripts from accessing the cookie
  //   secure: process.env.NODE_ENV === "development", // Secure cookies only in production with HTTPS
  //   sameSite: "strict", // Protects against CSRF attacks
  //   maxAge: 7 * 24 * 60 * 60 * 1000, // Cookie expiration (30 days)
  // });

  // Log success message
  console.log(
    `Token generated and sent via localstorage for user: ${(username, token)}`
  );
};

module.exports = generateToken;
