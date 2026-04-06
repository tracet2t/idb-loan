import User from "../models/userModel.js"; 
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: "User not found" });

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
      role: user.role
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