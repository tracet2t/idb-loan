require('dotenv').config(); // Loads your .env variables
const mongoose = require('mongoose');
const Role = require('./models/Role');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    // 1. Connect to Database
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB for seeding...");

    // 2. Clear existing roles/users (Only for fresh setup!)
    await Role.deleteMany();
    await User.deleteMany();

    // 3. Create the Super Admin Role
    const adminRole = await Role.create({
      name: 'SUPER_ADMIN',
      permissions: [
        'CREATE_LOAN', 'VIEW_LOANS', 'APPROVE_LOAN', 
        'REJECT_LOAN', 'UPLOAD_MIGRATION', 'VIEW_ANALYTICS',
        'MANAGE_USERS'
      ]
    });
    console.log("Admin Role Created.");

    // 4. Create the First Admin User
    const adminUser = await User.create({
      firstName: "Hidhas",
      lastName: "Mohamed",
      designation: "System Architect",
      email: "admin@idb.com",
      phoneNumber: "0112345678",
      address: {
        street: "Main St",
        city: "Colombo",
        district: "Colombo"
      },
      password: "Admin@123", // Pre-save hook in User.js will hash this automatically!
      role: adminRole._id,
      isTemporaryPassword: false
    });

    console.log("------------------------------------------");
    console.log("SUCCESS: Super Admin Created!");
    console.log(`Email: ${adminUser.email}`);
    console.log(`Password: Admin@123`);
    console.log("------------------------------------------");

    process.exit(); // Close the script
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
};

seedAdmin();