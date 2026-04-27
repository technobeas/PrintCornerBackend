const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: "../.env" });

const User = require("../models/User"); // adjust path

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const existingAdmin = await User.findOne({ userRole: "admin" });

    if (existingAdmin) {
      console.log("❌ Admin already exists");
      process.exit();
    }

    const hashedPassword = await bcrypt.hash("TAbish@123", 10);

    const admin = await User.create({
      userName: "Tabish",
      userEmail: "tabish@gmail.com",
      userPassword: hashedPassword,
      userRole: "admin",
    });

    console.log("✅ Admin created:", admin.userEmail);
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

createAdmin();
