import mongoose from "mongoose";

// const userSchema = new mongoose.Schema({
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ["super-admin", "data-entry"], default: "data-entry" },
//   isFirstLogin: { type: Boolean, default: true },
//   profile: {
//     fullName: String,
//     designation: String,
//     phone: String,
//     address: String,
//     studies: String,
//   }
// }, { timestamps: true });

// userModel.js update
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String }, 
  role: { type: String, enum: ["super-admin", "data-entry"], default: "data-entry" },
  status: { type: String, enum: ["Pending", "Active"], default: "Pending" }, // New Field
  inviteToken: String,        // For the Magic Link
  inviteTokenExpire: Date,    // Security expiry
  profile: {
    fullName: { type: String, default: "" },
    designation: { type: String, default: "" },
    phone: { type: String, default: "" },
    address: { type: String, default: "" },
    qualification: { type: String, default: "" }
  }
}, { timestamps: true });

export default mongoose.model("User", userSchema);