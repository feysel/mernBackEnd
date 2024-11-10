const express = require("express");
const router = express.Router();

// Sample in-memory posts data
let posts = [
  {
    id: 1,
    title: "First Post",
    content: "This is the content of the first post.",
  },
  {
    id: 2,
    title: "Second Post",
    content: "This is the content of the second post.",
  },
];

// GET /posts endpoint
router.get("/posts", (req, res) => {
  // Here, you might want to implement authentication and authorization checks
  res.json(posts);
});

module.exports = router;
