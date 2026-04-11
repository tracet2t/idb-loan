import mongoose from "mongoose";

const loanSchema = new mongoose.Schema(
  {
    applicantName:  { type: String, required: true },
    nic:            { type: String, required: true, unique: true },
    region:         { type: String, required: true },
    sector:         { type: String, required: true },
    amount:         { type: Number, required: true },
    loanReason:     { type: String, required: true },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Pending",
    },
    priority:       { type: Boolean, default: false },
    remarks:        { type: String, default: "" },
    appliedDate:    { type: Date, default: Date.now },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    proofDocuments: [
      {
        fileName:   { type: String },
        filePath:   { type: String },
        fileType:   { type: String },
        uploadedAt: { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Loan", loanSchema);