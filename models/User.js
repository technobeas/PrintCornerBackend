const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    userPassword: {
      type: String,
      required: true,
      select: false,
    },
    userRole: {
      type: String,
      enum: ["admin", "worker"],
      default: "worker",
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);

module.exports = User;
