import FundSettings from "../models/fundSettings.js";

// GET current year's fund allocation
export const getFundSettings = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    let settings = await FundSettings.findOne({ year });
    if (!settings) {
      return res.status(200).json({
        year,
        totalAllocation: 0,
        note: "",
        isDefault: true,
      });
    }
    res.status(200).json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fund settings" });
  }
};

// GET all years' fund allocations (for history table)
export const getAllFundSettings = async (req, res) => {
  try {
    const allSettings = await FundSettings.find()
      .sort({ year: -1 })
      .populate("setBy", "username email");
    res.status(200).json(allSettings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fund history" });
  }
};

// POST or UPDATE fund allocation for a year
export const setFundSettings = async (req, res) => {
  try {
    const { totalAllocation, year, note } = req.body;
    if (!totalAllocation || totalAllocation <= 0) {
      return res
        .status(400)
        .json({ message: "Please enter a valid allocation amount." });
    }
    const targetYear = year || new Date().getFullYear();
    const settings = await FundSettings.findOneAndUpdate(
      { year: targetYear },
      {
        totalAllocation,
        note: note || "",
        setBy: req.user?._id,
        year: targetYear,
      },
      { upsert: true, new: true },
    ).populate("setBy", "username email");
    res.status(200).json(settings);
  } catch (err) {
    res.status(500).json({ message: "Failed to save fund settings" });
  }
};
