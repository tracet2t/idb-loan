import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";
import dotenv from "dotenv";

dotenv.config();

const seedUsers = async () => {
  try {
    // 1. Connect to your MongoDB (Check your .env file)
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🌱 MongoDB Connected for Seeding...");

    // 2. Clear existing users (Optional - use carefully!)
    await User.deleteMany();

    // 3. Hash a default password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash("idb12345", salt);

    // 4. Create the Super Admin
    const admin = new User({
      email: "admin@idb.lk",
      password: hashedPassword,
      role: "super-admin",
      isFirstLogin: true, // This will trigger the "Force Password Change"
    });

    // 5. Create a Data Entry Trainee
    const staff = new User({
      email: "staff@idb.lk",
      password: hashedPassword,
      role: "data-entry",
      isFirstLogin: true,
    });

    await User.insertMany([admin, staff]);

    console.log("✅ Database Seeded Successfully!");
    console.log("User: admin@idb.lk | Pass: idb12345");
    
    process.exit();
  } catch (error) {
    console.error("❌ Seeding Error:", error);
    process.exit(1);
  }
};

seedUsers();