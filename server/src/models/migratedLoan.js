import mongoose from "mongoose";

const migratedLoanSchema = new mongoose.Schema(
  {
    // ── Original Excel Data ──────────────────────────────
    applicantName: { type: String, required: true, trim: true },
    nic: { type: String, required: true, trim: true },
    region: { type: String, required: true, trim: true },
    sector: { type: String, required: true, trim: true },
    amount: { type: Number, required: true },
    status: { type: String, default: "Pending" },
    appliedDate: { type: Date },
    priority: { type: Boolean, default: false },

    // ── Migration Metadata ───────────────────────────────
    migrationStatus: {
      type: String,
      enum: ["Migrated", "Sent to Queue", "Failed"],
      default: "Migrated",
    },
    migratedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    sentToQueue: { type: Boolean, default: false },
    sentAt: { type: Date },
    loanRef: { type: mongoose.Schema.Types.ObjectId, ref: "Loan" },
    batchId: { type: String }, // Groups records from same upload
    rowNumber: { type: Number }, // Original row number in Excel
  },
  { timestamps: true },
);

export default mongoose.model("MigratedLoan", migratedLoanSchema);
