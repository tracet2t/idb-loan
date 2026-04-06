import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["super-admin", "data-entry"], default: "data-entry" },
  isFirstLogin: { type: Boolean, default: true },
  profile: {
    fullName: String,
    designation: String,
    phone: String,
    address: String,
    studies: String,
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);