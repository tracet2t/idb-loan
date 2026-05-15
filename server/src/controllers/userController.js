import User from "../models/userModel.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import nodemailer from "nodemailer";
import sendEmail from "../utils/sendEmail.js";

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
    const { email, username, role, fullName, designation, phone } = req.body;
    // 1. Generate a random temporary token
    const inviteToken = crypto.randomBytes(32).toString("hex");

    // 2. Hash it (for DB storage)
    const hashedToken = crypto.createHash("sha256").update(inviteToken).digest("hex");

    // 3. Create User in 'Pending' state
    const newUser = await User.create({
      email,
        role,
        username,
        status: "Pending",
        inviteToken: hashedToken,
        inviteTokenExpire: Date.now() + 24 * 60 * 60 * 1000,
        profile: {
          fullName: fullName || "",
          designation: designation || "",
          phone: phone || ""
        }
    });

    // 4. Construct the Magic Link
    const inviteUrl = `${process.env.FRONTEND_URL}/setup-password/${inviteToken}`;
    const message = `Welcome to the IDB Loan Management System.\n\nPlease activate your account and set your password by clicking the link below:\n\n${inviteUrl}\n\nThis link is valid for 24 hours.`;

    // 5. Send the Email using the utility
    try {
      await sendEmail({
        email: newUser.email,
        subject: "Account Activation - IDB",
        inviteUrl: inviteUrl,
        message: message,
      });
      
      // If email succeeds, send success response
      res.status(201).json({ message: "Invitation sent successfully to " + email });
      
    } catch (err) {
      // If email fails, delete the "Pending" user so the admin can try again
      console.error("DETAILED EMAIL ERROR:", err);
      await User.findByIdAndDelete(newUser._id);
      return res.status(500).json({ message: "Email could not be sent. User not created.", error: err.message
       });
      
    }

  } catch (error) {
    console.error("INVITATION ERROR:", error);
    res.status(500).json({ message: "Error creating invitation" });
  }
};

// UPDATE USER
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { email, role, fullName, designation, phone } = req.body;

    // 1. Update Top Level Fields
    if (email) user.email = email;
    if (role) user.role = role;

    // 2. Update Nested Profile Fields (Professional approach)
    if (user.profile) {
      if (fullName) user.profile.fullName = fullName;
      if (designation) user.profile.designation = designation;
      if (phone) user.profile.phone = phone;
    }

    const updatedUser = await user.save();
    res.status(200).json({ message: "User updated successfully", updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Update failed", error: error.message });
  }
};

// DELETE USER
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Find the user first to see if they exist
    const user = await User.findById(id);
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2. Perform the deletion
    await User.findByIdAndDelete(id);

    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("DELETE ERROR:", error);
    res.status(500).json({ message: "Failed to delete user", error: error.message });
  }
};

// RESET PASSWORD
// export const resetUserPassword = async (req, res) => {
//   try {
//     const hashedPassword = await bcrypt.hash(req.body.newPassword, 10);
//     await User.findByIdAndUpdate(req.params.id, { password: hashedPassword, isFirstLogin: true });
//     res.status(200).json({ message: "Password reset successful" });
//   } catch (error) {
//     res.status(500).json({ message: "Reset failed" });
//   }
// };

export const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { 
        $set: { 
          password: hashedPassword, 
        } 
      },
      { new: true } 
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Password reset successful. User remains Active." });
  } catch (error) {
    console.error("RESET ERROR:", error);
    res.status(500).json({ message: "Reset failed", error: error.message });
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

    //SAFETY CHECK: If the 'profile' object doesn't exist in DB, create it now
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

export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      inviteToken: hashedToken, 
      inviteTokenExpire: { $gt: Date.now() }, 
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired invitation link." });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.status = "Active";
    user.inviteToken = undefined;
    user.inviteTokenExpire = undefined;

    await user.save();

    res.status(200).json({ message: "Account activated successfully!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};