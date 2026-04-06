import User from "../models/userModel.js";
import bcrypt from "bcryptjs";

// GET ALL USERS
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// CREATE USER
export const createUser = async (req, res) => {
  try {
    const { username, email, password, role, fullName, designation, phone, address, qualification } = req.body;

    // 1. Basic Validation
    if (!username || !email || !password) {
      return res.status(400).json({ message: "Username, Email, and Password are required" });
    }

    // 2. Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // 3. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create User (Mapping qualification to studies if needed by your schema)
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "data-entry",
      isFirstLogin: true,
      profile: {
        fullName,
        designation,
        phone,
        address,
        studies: qualification // Mapping frontend 'qualification' to backend 'studies'
      }
    });

    res.status(201).json(newUser);
  } catch (error) {
    res.status(400).json({ message: "User creation failed", error: error.message });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { fullName, designation, phone, address, qualification, role } = req.body;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      id,
      {
        $set: {
          email,
          role,
          "profile.fullName": fullName,
          "profile.designation": designation,
          "profile.phone": phone,
          "profile.address": address,
          "profile.studies": qualification,
        },
      },
      { new: true }
    ).select("-password");
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "User deleted" });
  } catch (error) {
    res.status(500).json({ message: "Delete failed" });
  }
};

// RESET PASSWORD
export const resetUserPassword = async (req, res) => {
  try {
    const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
    await User.findByIdAndUpdate(req.params.id, { password: hashedPassword, isFirstLogin: true });
    res.status(200).json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: "Reset failed" });
  }
};