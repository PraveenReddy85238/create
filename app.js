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
        VALUES (${username}, ${name}, ${hashedPassword}, ${gender}, ${location})`;

      let createUserName = await db.run(createUserNameQuery);

      response.status(200);
      response.send("User created successfully");
    }
  } else {
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login", async (request, response) => {
  const { username, password } = request.body; // object destructuring body contains username and password
  const checkingUserQuery = `SELECT * FROM 
    user 
    WHERE 
    username LIKE ${username}`; //checking whether the user register or not
  const dbUser = await db.get(checkingUserQuery);

  if (dbUser === undefined) {
    //if user not register send response 400

    response.status(400);
    response.send("Invalid user");
  } else {
    const comparePassword = await bcrypt.compare(password, dbUser.password); //if user register with username compare the password

    if (comparePassword === true) {
      response.send(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

app.put("/change-password", async (request, response) => {
  const { username, oldPassword, newPassword } = request.params;

  const checkingUsernameQuery = `SELECT * 
  FROM user 
  WHERE 
  username LIKE ${username}`;

  const dbUser = await db.get(checkingUsernameQuery);

  if (dbUser === undefined) {
    response.status(400);
    response.send("user not registered");
  } else {
    const comparePassword = await bcrypt.compare(oldPassword, dbUser.password);
    if (comparePassword === true) {
      const lengthOfNewPassword = newPassword.length;
      if (lengthOfNewPassword < 5) {
        response.status(400);
        response.send("Password is too short");
      } else {
        const encryptPassword = await bcrypt.hash(newPassword, 10);

        const insertNewPassWordQuery = `UPDATE user SET password = ${encryptPassword}`;

        await db.run(insertNewPassWordQuery);

        response.status(200);

        response.send("Password updated");
      }
    } else {
      response.status(400);
      response.send("Invalid current password");
    }
  }
});
