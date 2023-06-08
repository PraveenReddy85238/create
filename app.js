const express = require("express");

const app = express();

app.use(express.json());

const sqlite3 = require("sqlite3");

const { open } = require("sqlite");

const path = require("path");

const bcrypt = require("bcrypt");

let db = null;

const dbPath = path.join(__dirname, "userData.db");

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    app.listen(3000, () => {
      console.log("Server Started");
    });
  } catch (e) {
    console.log(e.message);
    process.exit(1);
  }
};

initializeDBAndServer();

app.post("/register", async (request, response) => {
  let { username, name, password, gender, location } = request.body; //Destructuring the data from the API call

  let hashedPassword = await bcrypt.hash(password, 10); //Hashing the given password

  let checkTheUsername = `
            SELECT *
            FROM user
            WHERE username = '${username}';`;
  let userData = await db.get(checkTheUsername); //Getting the user details from the database
  if (userData === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      let createUserNameQuery = `INSERT INTO
        user (username, name,password, gender, location)
        VALUES (${username}, ${name}, ${password}, ${gender}, ${location})`;

      let createUserName = await db.run(createUserNameQuery);

      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});
