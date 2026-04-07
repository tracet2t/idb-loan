import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    applicantName: { type: String, required: true },
    nic:           { type: String, required: true, unique: true },
    region:        { type: String, required: true },
    sector:        { type: String, required: true },
    amount:        { type: Number, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    priority:      { type: Boolean, default: false },
    appliedDate:   { type: Date, default: Date.now },
    remarks:       { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Loan", loanSchema);