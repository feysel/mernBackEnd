const mysql = require("mysql2/promise");
require("dotenv").config();//to be defined the env envirometal variable

// Create connection pool
const dbConnection = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
//console.log(process.env.DB_HOST)
// Function to create tables
const createTables = async () => {
  const usersTable = `
    CREATE TABLE IF NOT EXISTS users (
      userid INT(20) NOT NULL AUTO_INCREMENT,
      username VARCHAR(20) NOT NULL,
      firstname VARCHAR(20) NOT NULL,
      lastname VARCHAR(20) NOT NULL,
      email VARCHAR(40) NOT NULL,
      password VARCHAR(100) NOT NULL,
      PRIMARY KEY (userid)
    );
  `;

  const questionsTable = `
    CREATE TABLE IF NOT EXISTS questions (
      questionid INT(20) NOT NULL AUTO_INCREMENT,
      userid INT(20) NOT NULL,
      title VARCHAR(50) NOT NULL,
      description VARCHAR(200) NOT NULL,
      tag VARCHAR(20),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (questionid),
      FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  const answersTable = `
    CREATE TABLE IF NOT EXISTS answers (
      answerid INT AUTO_INCREMENT NOT NULL,
      userid INT NOT NULL,
      questionid INT NOT NULL,
      answer VARCHAR(200) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (answerid),
      FOREIGN KEY (questionid) REFERENCES questions(questionid) ON DELETE CASCADE ON UPDATE CASCADE,
      FOREIGN KEY (userid) REFERENCES users(userid) ON DELETE CASCADE ON UPDATE CASCADE
    );
  `;

  const connection = await dbConnection.getConnection();
  try {
    await connection.beginTransaction();

    await connection.query(usersTable);
    await connection.query(questionsTable);
    await connection.query(answersTable);

    await connection.commit();
    console.log("Tables created successfully");
  } catch (err) {
    await connection.rollback();
    console.error("Error creating tables:", err);
  } finally {
    connection.release();
  }
};

// Connect to MySQL and create tables
createTables().catch((err) => {
  console.error("Error connecting to the database:", err);
});

module.exports = dbConnection;
