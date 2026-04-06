import Loan from "../models/loan.js";

export const getDashboardStats = async (req, res) => {
  try {
    // 1. Total LKR and Count by Sector (For Pie Chart)
    const sectorStats = await Loan.aggregate([
      { $match: { status: "Approved" } },
      { $group: { _id: "$sector", totalAmount: { $sum: "$amount" }, count: { $sum: 1 } } }
    ]);

    // 2. Monthly Trend (For Line Chart)
    const monthlyStats = await Loan.aggregate([
      { $match: { status: "Approved" } },
      { $group: {
          _id: { $month: "$appliedDate" },
          total: { $sum: "$amount" }
      }},
      { $sort: { "_id": 1 } }
    ]);

    res.status(200).json({ sectorStats, monthlyStats });
  } catch (err) {
    res.status(500).json({ message: "Analytics Engine Error" });
  }
};