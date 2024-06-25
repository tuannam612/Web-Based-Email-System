class Message {
    constructor(sender, receiver, subject, message, sendAt, readAt) {
      this._sender = sender;
      this._receiver = receiver;
      this._message = message;
      this._sendAt = sendAt;
      this._readAt = readAt;
      this._subject = subject;
    }
    set sender(sender) {
      this._sender = sender;
    }
    set receiver(receiver) {
      this._receiver = receiver;
    }
    set message(message) {
      this._message = message;
    }
    set sendAt(sendAt) {
      this._sendAt = sendAt;
    }
    set readAt(readAt) {
      this._readAt = readAt;
    }
    set subject(subject) {
     this._subject = subject;
    }
    get sender() {
      return this._sender;
    }
    get receiver() {
      return this._receiver;
    }
    get message() {
      return this._message;
    }
    get sendAt() {
      return this._sendAt;
    }
    get readAt() {
      return this._readAt;
    }
    get subject() {
      return this._subject;
    }
  }
  module.exports = Message;
  