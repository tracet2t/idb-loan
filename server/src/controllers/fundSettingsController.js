import FundSettings from "../models/fundSettings.js";

// GET current year's total allocation (sum of all months)
export const getFundSettings = async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const result = await FundSettings.aggregate([
      { $match: { year } },
      { $group: { _id: null, totalAllocation: { $sum: "$totalAllocation" } } },
    ]);
    res.status(200).json({
      year,
      totalAllocation: result[0]?.totalAllocation || 0,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fund settings" });
  }
};

// GET all allocations with optional filters
export const getAllFundSettings = async (req, res) => {
  try {
    const { sortBy = "createdAt", order = "desc", year } = req.query;
    const filter = {};
    if (year) filter.year = Number(year);

    const sortOrder = order === "asc" ? 1 : -1;
    const validSortFields = ["totalAllocation", "createdAt", "year", "month"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";

    const allSettings = await FundSettings.find(filter)
      .sort({ [sortField]: sortOrder })
      .populate("setBy", "username email");

    res.status(200).json(allSettings);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fund history" });
  }
};

// GET monthly allocation chart data
export const getFundChartData = async (req, res) => {
  try {
    const year = req.query.year || new Date().getFullYear();
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Allocations per month
    const allocations = await FundSettings.aggregate([
      { $match: { year: Number(year) } },
      {
        $group: {
          _id: "$month",
          totalAllocated: { $sum: "$totalAllocation" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Approved (distributed) per month from loans
    const { default: Loan } = await import("../models/loan.js");
    const distributions = await Loan.aggregate([
      {
        $match: {
          status: "Approved",
          appliedDate: {
            $gte: new Date(`${year}-01-01`),
            $lte: new Date(`${year}-12-31`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$appliedDate" },
          totalDistributed: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Build chart data for all 12 months
    const chartData = monthNames.map((month, i) => {
      const mNum = i + 1;
      const alloc = allocations.find((a) => a._id === mNum);
      const dist = distributions.find((d) => d._id === mNum);
      return {
        month,
        allocated: alloc?.totalAllocated || 0,
        distributed: dist?.totalDistributed || 0,
        loanCount: dist?.count || 0,
      };
    });

    res.status(200).json(chartData);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch fund chart data" });
  }
};

// POST — create new allocation
export const createFundSettings = async (req, res) => {
  try {
    const { totalAllocation, year, month, day, date, note } = req.body;
    console.log("Received body:", req.body);
    console.log("Parsed date:", date, "→", new Date(date));

    if (!totalAllocation || totalAllocation <= 0)
      return res
        .status(400)
        .json({ message: "Please enter a valid allocation amount." });
    if (!month || month < 1 || month > 12)
      return res.status(400).json({ message: "Please select a valid month." });

    const allocationDate = date
      ? new Date(date)
      : new Date(year, month - 1, day || 1);

    const settings = await FundSettings.create({
      totalAllocation: Number(totalAllocation),
      year: Number(year) || new Date().getFullYear(),
      month: Number(month),
      day: Number(day) || new Date().getDate(),
      allocationDate,
      note: note || "",
      setBy: req.user?._id,
    });

    const populated = await settings.populate("setBy", "username email");
    res.status(201).json(populated);
  } catch (err) {
    console.error("Create fund error:", err.message);
    res.status(500).json({ message: "Failed to create fund allocation" });
  }
};

// PATCH — edit existing allocation
export const updateFundSettings = async (req, res) => {
  try {
    const { totalAllocation, note, month, year } = req.body;
    const updated = await FundSettings.findByIdAndUpdate(
      req.params.id,
      { totalAllocation, note, month, year },
      { new: true },
    ).populate("setBy", "username email");

    if (!updated)
      return res.status(404).json({ message: "Allocation not found" });

    res.status(200).json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to update allocation" });
  }
};

// DELETE — remove allocation
export const deleteFundSettings = async (req, res) => {
  try {
    const deleted = await FundSettings.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Allocation not found" });
    res.status(200).json({ message: "Allocation deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete allocation" });
  }
};
