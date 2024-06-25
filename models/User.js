class User {
    constructor(fullName, email, password) {
      this._fullName = fullName;
      this._email = email;
      this._password = password;
    }
    set fullName(fullName) {
      this._fullName = fullName;
    }
    set email(email) {
      this._email = email;
    }
    set password(password) {
      this._password = password;
    }
    get fullName() {
      return this._fullName;
    }
    get email() {
      return this._email;
    }
    get password() {
      return this._password;
    }
  }
  
  module.exports = User;
  