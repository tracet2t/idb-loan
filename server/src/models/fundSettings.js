import mongoose from "mongoose";

const fundSettingsSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true },
    month: { type: Number, required: true, min: 1, max: 12 },
    day: { type: Number, min: 1, max: 31 },
    allocationDate: { type: Date, required: true },
    totalAllocation: { type: Number, required: true },
    note: { type: String, default: "" },
    setBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

fundSettingsSchema.index({ year: 1, month: 1, createdAt: 1 });
export default mongoose.model("FundSettings", fundSettingsSchema);
