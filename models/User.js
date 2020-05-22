const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    minlength: 1,
    validate: {
      validator: uname => /^[a-zA-Z0-9\-\_]+$/.test(uname),
      message: 'No special characters allowed in username'
    }
  },
  password: { type: String, required: true, minlength: 8 },
  favorite_fruit: { type: String, required: true },
  _created_on: { type: Date, required: true },
  last_login: Date,
  login_count: Number,
  messages_sent: Number
})

module.exports = mongoose.model('User', schema);
