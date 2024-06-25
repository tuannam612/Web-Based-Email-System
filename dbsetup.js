require("dotenv").config();
const mysql = require("mysql2")
const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
}); 
const User = require("./models/User");
const UserRepository = require("./repositories/UserRepository");
const Message = require("./models/Message");
const MessageRepository = require("./repositories/MessageRepository");
module.exports = connection;

function generateMessage() {
  const messages = [
    "Believe in yourself, for within you lies the power to achieve greatness.",
    "In the face of adversity, resilience becomes our greatest strength.",
    "Kindness is not a weakness; it is a reflection of our inherent humanity.",
    "The greatest journeys begin with a single step of courage.",
    "Creativity knows no boundaries; it is the freedom to express your unique soul.",
    "Failure is not the end but a stepping stone towards wisdom and growth",
  ];
  return messages[Math.floor(Math.random() * messages.length)];
}
connection.query(
  "CREATE TABLE IF NOT EXISTS users (fullName VARCHAR(255), email VARCHAR(255) PRIMARY KEY, password VARCHAR(255))",
  (err, result) => {
    if (err) throw err;
    console.log("User table created successfully");


    connection.query(
      "CREATE TABLE IF NOT EXISTS messages (id INT AUTO_INCREMENT PRIMARY KEY, sender VARCHAR(255), receiver VARCHAR(255), subject TEXT, message TEXT, sendAt DATETIME, readAt DATETIME, receiverDeleted BOOLEAN NOT NULL default 0, senderDeleted BOOLEAN NOT NULL default 0, attachment VARCHAR(255), FOREIGN KEY (sender) REFERENCES users(email), FOREIGN KEY (receiver) REFERENCES users(email))",
      (err, result) => {
        if (err) throw err;
        console.log("Message table created successfully");
        const user1 = new User("Tuan Nam", "nam6@gmail.com", "123456");
        const user2 = new User("Cheese Vu", "Cheeses@gmail.com", "123456");
        const user3 = new User("Alex Sandler", "a@a.com", "123456");

        const userRepository = new UserRepository(connection);
        Promise.all([
          userRepository.createUser(user1),
          userRepository.createUser(user2),
          userRepository.createUser(user3),
        ])
          .then((result) => {
            console.log("Users created successfully");
            const messageRepository = new MessageRepository(connection);
            const messageData = [
              new Message(
                user1.email,
                user2.email,
                generateMessage(),
                generateMessage(),
                new Date(),
                new Date()
              ),
              new Message(
                user2.email,
                user1.email,
                generateMessage(),
                generateMessage(),
                new Date()
              ),
              new Message(
                user1.email,
                user3.email,
                generateMessage(),
                generateMessage(),
                new Date()
              ),
              new Message(
                user3.email,
                user1.email,
                generateMessage(),
                null,
                new Date(),
                new Date()
              ),
              new Message(
                user2.email,
                user3.email,
                generateMessage(),
                generateMessage(),
                new Date(),
                new Date()
              ),
              new Message(
                user3.email,
                user2.email,
                generateMessage(),
                null,
                new Date()
              ),
              new Message(
                user3.email,
                user2.email,
                generateMessage(),
                generateMessage(),
                new Date(),
                new Date()
              ),
              new Message(
                user3.email,
                user2.email,
                generateMessage(),
                null,
                new Date()
              ),
            ];
            Promise.all(
              messageData.map((data) => {
                return messageRepository.createMessage(data);
              })
            )
              .then((result) => {
                console.log("Messages created successfully");
                process.exit();
              })
              .catch((err) => {
                console.log(err);
                process.exit();
              });
          })
          .catch((err) => {
            console.log(err);
            process.exit();
          });
      }
    );
  }
);










