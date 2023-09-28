const mongoose = require("mongoose");

const User = mongoose.model("User", {
  email: String,
  createdAt: Date,
  loginInfo: {
    loginCount: Number,
    lastLogin: Date,
  },
});

const Mail = mongoose.model("Mail", {
  sender: String,
  receiver: [String],
  cc: [String],
  createdAt: Date,
});

module.exports = {
  User,
  Mail,
};
