import mongoose from "mongoose";

const fundSettingsSchema = new mongoose.Schema(
  {
    year: { type: Number, required: true, unique: true },
    totalAllocation: { type: Number, required: true },
    note: { type: String, default: "" },
    setBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

export default mongoose.model("FundSettings", fundSettingsSchema);
