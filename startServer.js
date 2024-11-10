// startServer.js
//const serverless = require("serverless-http"); // Add this
const dbConnection = require("./Database/dbconfig");
const startServer = async (app, PORT) => {
  try {
    await dbConnection.execute("SELECT 'test'");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log("Database connected");
    });
  } catch (error) {
    console.error("Database connection error:", error.message);
    process.exit(1); // Exit process with failure
  }
};

module.exports = startServer;
