const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("./models/User");

dotenv.config();

mongoose.connect(process.env.MONGO_URI);

const seedAdmin = async () => {
  const hashedPassword = await bcrypt.hash(
    "admin123",
    10
  );

  await User.create({
    name: "Admin",
    email: "admin@gmail.com",
    password: hashedPassword,
    role: "admin",
  });

  console.log("Admin Created");

  process.exit();
};

seedAdmin();