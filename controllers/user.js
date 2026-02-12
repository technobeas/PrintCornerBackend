const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

async function handleCreateUser(req, res) {
  try {
    const { userName, userEmail, userPassword, userRole } = req.body;

    if (!userName || !userEmail || !userPassword || !userRole) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    if (!["admin", "worker"].includes(userRole)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    if (userRole === "admin") {
      const adminExists = await User.findOne({ userRole: "admin" });
      if (adminExists) {
        return res.status(400).json({ msg: "Admin already exists" });
      }
    }

    const userExists = await User.findOne({ userEmail });
    if (userExists) {
      return res.status(400).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(userPassword, 10);

    const createdUser = await User.create({
      userName,
      userEmail,
      userPassword: hashedPassword,
      userRole,
    });

    return res.status(201).json({
      userName: createdUser.userName,
      userEmail: createdUser.userEmail,
      userRole: createdUser.userRole,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Internal server error" });
  }
}

async function handleUserLogin(req, res) {
  try {
    const { userEmail, userPassword } = req.body;

    if (!userEmail || !userPassword) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    const user = await User.findOne({ userEmail }).select("+userPassword");

    if (!user) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(userPassword, user.userPassword);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid email or password" });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        userRole: user.userRole,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    return res.json({
      userEmail: user.userEmail,
      userRole: user.userRole,
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Internal server error" });
  }
}

async function handleDeleteUser(req, res) {
  try {
    const id = req.params.id;

    const userToBeDeleted = await User.findByIdAndDelete(id);

    if (!userToBeDeleted) {
      return res.status(404).json({ msg: "User not found" });
    }

    return res.json({
      userId: userToBeDeleted._id,
      msg: "User deleted successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Internal server error" });
  }
}

async function handleGetUser(req, res) {
  try {
    const users = await User.find();

    if (!users || users.length === 0) {
      return res.status(404).json({ msg: "No users found" });
    }

    return res.json({
      count: users.length,
      users,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ msg: "Internal server error" });
  }
}

module.exports = {
  handleCreateUser,
  handleUserLogin,
  handleDeleteUser,
  handleGetUser,
};
