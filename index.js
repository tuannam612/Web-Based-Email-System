const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const path = require("path")
require("dotenv").config();
app.use(cookieParser());
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
const multer = require('multer');
const UserRepository = require("./repositories/UserRepository");
const MessageRepository = require("./repositories/MessageRepository");
const Message = require("./models/Message");
const mysql = require("mysql2");
const User = require("./models/User");

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

//routes  


//connect to storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads')); // Store the files in the 'uploads' directory within your project
  },
  filename: function (req, file, cb) {
    cb(null,Date.now() + path.extname(file.originalname)); // Use the original file name as the stored file name
  }
});
const upload = multer({ storage: storage });

const authHandler = (req, res, next) => {
  const isAuth = !!req.cookies.email;
  if (!isAuth) {
    if (req.originalUrl == '/outbox' || req.originalUrl == '/compose-message' || req.originalUrl == '/index') {
      res.render("access-denied.ejs")
    } else {
    res.render("signin.ejs");
    }
  } else {
    next();
  }
};

app.get("/", authHandler, function(req,res) {
  if (!authHandler) {
    res.render("signin.ejs")
  } else {
    res.redirect('/index')
  }
});
app.get("/index", authHandler, function (req, res) {
  const receiver = req.cookies.email;
  const messageRepository = new MessageRepository(connection);
  messageRepository
    .getEmailList(receiver, req.query.pageNumber, req.query.pageSize)
    .then((result) => {
      const userRepository = new UserRepository(connection);
      userRepository.getUserByEmail(req.cookies.email).then((last) => {
        const name = last.fullName;
        res.render("index.ejs", {
          list: res,
          email: req.cookies.email,
          data: result,
          fullname: name,
        });
      });
    });
});

app.get("/signup", (req, res) => {
  res.render('signup', { err: null })
});
app.get("/messages", authHandler, () => {
  res.send(res);
});

app.get("/logout", function (req, res) {
  res.clearCookie("email");
  res.redirect("/");
});

app.post("/signin", upload.none(), function (req, res) {
  const email = req.body.email;
  const password = req.body.password;

  const userRepository = new UserRepository(connection);
  userRepository
    .getUserByEmailAndPassword(email, password)
    .then((result) => {
      if (result.length > 0) {
        res.cookie("email", email, { maxAge: 1000000 });
        res.redirect("/index");
      } else {
        res.render("signin.ejs", {
          error: "Invalid email or password",
          input: { email, password },
        });
      }
    })
    .catch((err) => {
      res.redirect("/");
    });
});
app.get('/index', function (req, res) {
  res.render("index.ejs")
});
app.get("/compose-message", authHandler, function (req, res) {
  const userRepository = new UserRepository(connection);
  userRepository.getAllUsers().then((result) => {
    res.render("compose.ejs", {
      emails: result
        .map((el) => el.email)
        .filter((str) => str !== req.cookies.email),
    });
  });
});

app.get("/message/:id", authHandler, function (req, res) {
  const id = req.params.id;
  const messageRepository = new MessageRepository(connection);
  messageRepository
    .getEmailById(id)
    .then((result) => {
      if (req.headers.referer === 'http://localhost:8000/outbox') {
        res.render("messageDetail.ejs", { data: result, abc: '/outbox' });
      }
      else {
        res.render('messageDetail.ejs', { data: result, abc: '/index' });
      }
    })
    .catch((err) => {
      res.render("messageDetail.ejs");
    });
});

app.post("/compose-message", authHandler, upload.single('attachment'), function (req, res) {
  const messageRepository = new MessageRepository(connection);
  const userRepository = new UserRepository(connection);
  const sender = req.cookies.email;
  const attachment = req.file ? req.file.filename : null;
  userRepository.getAllUsers().then((users) => {
    if (!req.body.receiver) {
      res.render("compose.ejs", {
        error: "Receiver is required",
        input: {
          receiver: req.body.receiver,
          subject: req.body.subject,
          message: req.body.message,
        },
        emails: users
          .map((el) => el.email)
          .filter((str) => str !== req.cookies.email),
      });
      return;
    }
    userRepository.getUserByEmail(req.body.receiver).then((result) => {
      if (!result) {
        res.render("compose.ejs", {
          error: "Receiver does not exist",
          input: {
            receiver: req.body.receiver,
            subject: req.body.subject,
            message: req.body.message,
            attachment: attachment,
          },
          emails: users
            .map((el) => el.email)
            .filter((str) => str !== req.cookies.email),
        });
        return;
      }
      const newMessage = new Message(
        sender,
        req.body.receiver,
        req.body.subject,
        req.body.message,
        new Date(),
        null,
        false,
        false,
        attachment,
      );
      messageRepository
        .createMessage(newMessage)
        .then((result) => {
          res.render("compose.ejs", { error: "Message sent successfully" });
        })
        .catch((err) => {
          res.render("compose.ejs", {
            error: "Something went wrong",
            input: {
              receiver: req.body.receiver,
              subject: req.body.subject,
              message: req.body.message,
              attachment: attachment,
            },
          });
        });
    });
  });
});

app.get("/api/messages", authHandler, function (req, res) {
  const receiver = req.cookies.email;
  const messageRepository = new MessageRepository(connection);
  messageRepository
    .getEmailList(receiver, req.query.pageNumber, req.query.pageSize)
    .then((result) => {
      res.json(result);
    });
});

app.get("/outbox", authHandler, function (req, res) {
  const sender = req.cookies.email;
  const messageRepository = new MessageRepository(connection);
  messageRepository
    .getEmailBySender(sender, req.query.pageNumber, req.query.pageSize)
    .then((result) => {
      const userRepository = new UserRepository(connection);
      userRepository.getUserByEmail(req.cookies.email).then((last) => {
        const name = last.fullName;
        res.render("outbox.ejs", {
          list: res,
          email: req.cookies.email,
          data: result,
          fullname: name,
        });
      });
    });
});



app.get("/api/outbox", authHandler, function (req, res) {
  const sender = req.cookies.email;
  const messageRepository = new MessageRepository(connection);
  messageRepository
    .getEmailBySender(sender, req.query.pageNumber, req.query.pageSize)
    .then((result) => {
      res.json(result);
    });
});


app.post("/signup", (req, res) => {
  const { fullname, email, password, confirmPassword } = req.body;
  if (!fullname || !email || !password || !confirmPassword) {
    return res.render('signup', { error: 'Please fill in all fields' });
  }
  connection.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Error checking email existence in the database:', err);
      return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
    }

    if (results.length > 0) {
      return res.render('signup', { error: 'Email address is already in use' });
    }
    if (password !== confirmPassword) {
      return res.render('signup', { error: 'Passwords do not match' });
    }
    connection.query('INSERT INTO users (fullname, email, password) VALUES (?, ?, ?)', [fullname, email, password], (err, result) => {
      if (err) {
        console.error('Error inserting new user into the database:', err);
        return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
      }

      const newUser = {
        id: result.insertId,
        fullname,
        email,
        password,
      };
      res.cookie('userId', newUser.id.toString());
      res.render('welcome', { user: newUser });
    });
  });
});

app.delete("/api/delete", authHandler, function (req, res) {
  const person = req.cookies.email;
  const messageRepository = new MessageRepository(connection);
  if (req.query.action === "receiver") {
    messageRepository
      .deleteListOfEmailByReceiverEmail(person, req.query.ids)
      .then((result) => {
        res.json(result);
      });
  } else if (req.query.action === "sender") {
    messageRepository
      .deleteListOfEmailBySenderEmail(person, req.query.ids)
      .then((result) => {
        res.json(result);
      });
  } else {
    res.status(400).send("Bad request");
  }
});

app.listen(8000);
console.log("Server is listening on port 8000");