class UserRepository {
  constructor(connection) {
    this._connection = connection;
  }

  createUser(user) {
    return new Promise((resolve, reject) => {
      this._connection.query(
        "INSERT INTO users (fullName, email, password) VALUES (?, ?, ?)",
        [user.fullName, user.email, user.password],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });
  }

  getUserByEmailAndPassword(email, password) {
    return new Promise((resolve, reject) => {
      this._connection.query(
        "SELECT * FROM users WHERE email = ? AND password = ?",
        [email, password],
        (err, result) => {
          if (err) reject(err);
          resolve(result);
        }
      );
    });
  }

  getAllUsers() {
    return new Promise((resolve, reject) => {
      this._connection.query("SELECT * FROM users", (err, result) => {
        if (err) reject(err);
        resolve(result);
      });
    });
  }

  getUserByEmail(email) {
    return new Promise((resolve, reject) => {
      this._connection.query(
        "SELECT * FROM users WHERE email = ?",
        [email],
        (err, result) => {
          if (err) reject(err);
          resolve(result[0]);
        }
      );
    });
  }
}

module.exports = UserRepository;
