import mongoose from "mongoose";

const loanSchema = new mongoose.Schema({
  applicantName: { type: String, required: true },
  nic: { type: String, required: true, unique: true },
  region: { type: String, required: true }, // e.g., Southern, Northern
  sector: { type: String, required: true }, // e.g., Fisheries, SME, Agriculture
  amount: { type: Number, required: true },
  status: { 
    type: String, 
    enum: ["Pending", "Approved"], 
    default: "Pending" 
  },
  appliedDate: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model("loan", loanSchema);