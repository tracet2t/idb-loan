import User from "../models/userModel.js"; 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    // const user = await User.findOne({ email });

    const user = await User.findOne({ 
      $or: [{ email: email }, { username: email }] 
    });

    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.status === "Pending") {
      return res.status(401).json({ 
        message: "Your account is not yet activated. Please check your email to set your password." 
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // JWT Secret check
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: "JWT Secret is missing in server config" });
    }

    const token = jwt.sign(
        { id: user._id, role: user.role }, 
        process.env.JWT_SECRET, 
        { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      isFirstLogin: user.isFirstLogin,
      role: user.role,
      status: user.status
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error during login" });
  }
};

export const completeProfile = async (req, res) => {
  try {
    const { newPassword, fullName, designation, phone, address, studies } = req.body;
    
    // Safety check: Don't let them onboarding twice
    const user = await User.findById(req.user.id);
    if (!user.isFirstLogin) {
        return res.status(400).json({ message: "Profile already finalized." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    const updatedUser = await User.findByIdAndUpdate(req.user.id, {
      password: hashedPassword,
      profile: { fullName, designation, phone, address, studies },
      isFirstLogin: false 
    }, { new: true });

    // Don't send the password back in the response!
    const userResponse = updatedUser.toObject();
    delete userResponse.password;

    res.status(200).json({ message: "Profile updated successfully", user: userResponse });
  } catch (error) {
    console.error("Profile Update Error:", error);
    res.status(500).json({ message: "Update failed. Ensure all fields are valid." });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // 1. Hash the token from URL to compare with the one in DB
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // 2. Find user using the field names from your userSchema
    const user = await User.findOne({
      inviteToken: hashedToken, // Matches your Schema
      inviteTokenExpire: { $gt: Date.now() } // Matches your Schema
    });

    if (!user) return res.status(400).json({ message: "Link invalid or expired" });

    // 3. Set the new password (your pre-save hook or manual hashing will handle this)
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    
    // 4. Update status and clear tokens
    user.status = "Active"; 
    user.inviteToken = undefined;
    user.inviteTokenExpire = undefined;
    
    await user.save();

    res.status(200).json({ message: "Account activated! Please login." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Verification failed" });
  }
};