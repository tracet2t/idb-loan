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
  const { fullName, designation, phone, address, qualification, role, email } = req.body;

  try {
    // 1. Find the user first to ensure they exist
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 2. Initialize profile if it doesn't exist
    if (!user.profile) user.profile = {};

    // 3. Update top-level fields
    if (email) user.email = email;
    if (role) user.role = role;

    // 4. Update nested profile fields
    if (fullName !== undefined) user.profile.fullName = fullName;
    if (designation !== undefined) user.profile.designation = designation;
    if (phone !== undefined) user.profile.phone = phone;
    if (address !== undefined) user.profile.address = address;
    if (qualification !== undefined) user.profile.studies = qualification;

    // 5. Save the document (this triggers validation and pre-save hooks)
    const updatedUser = await user.save();

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("USER MANAGEMENT UPDATE ERROR:", error.message);
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

// GET CURRENT LOGGED-IN USER PROFILE
export const getMyProfile = async (req, res) => {
  try {
    // req.user.id is set by your authMiddleware
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

// UPDATE CURRENT LOGGED-IN USER PROFILE
export const updateMyProfile = async (req, res) => {
  try {
    // Standardize the ID check
    const userId = req.user?._id || req.user?.id; 
    
    if (!userId) {
        return res.status(401).json({ message: "Not authorized, no ID found" });
    }

    const user = await User.findById(userId);
    const { fullName, designation, phone, address, qualification, password } = req.body;

    // ✅ SAFETY CHECK: If the 'profile' object doesn't exist in DB, create it now
    if (!user.profile) {
      user.profile = {};
    }

    // 1. Update Profile Fields using optional chaining or direct assignment
    if (fullName) user.profile.fullName = fullName;
    if (designation) user.profile.designation = designation;
    if (phone) user.profile.phone = phone;
    if (address) user.profile.address = address;
    if (qualification) user.profile.studies = qualification; 
    
    // 2. Update Password
    if (password && password.trim() !== "") {
      user.password = await bcrypt.hash(password, 10);
    }

    // This triggers the .save() which handles the nesting in MongoDB
    const updatedUser = await user.save();
    
    res.status(200).json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("BACKEND ERROR:", error.message); // Look at your terminal for this!
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};