import Loan from "../models/loan.js";
import FundSettings from "../models/fundSettings.js";

export const getDashboardStats = async (req, res) => {
  try {
    // ── 1. KPI Counts ──────────────────────────────────────────
    const totalApplications = await Loan.countDocuments();
    const pending = await Loan.countDocuments({ status: "Pending" });
    const underReview = await Loan.countDocuments({ status: "Under Review" });
    const approved = await Loan.countDocuments({ status: "Approved" });
    const rejected = await Loan.countDocuments({ status: "Rejected" });

    // ── 2. Financial KPIs ──────────────────────────────────────
    // Total allocation — read from FundSettings collection
    const currentYear = new Date().getFullYear();
    const fundSettings = await FundSettings.findOne({ year: currentYear });
    const totalAllocation = fundSettings?.totalAllocation || 0;

    // Sum of all approved loan amounts
    const approvedAmountResult = await Loan.aggregate([
      { $match: { status: "Approved" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);
    const approvedAmount = approvedAmountResult[0]?.total || 0;
    const balanceAmount = totalAllocation - approvedAmount;
    const utilizationPct = Math.min(
      (approvedAmount / totalAllocation) * 100,
      100,
    );

    // ── 3. Sector-Wise Stats (Donut Chart) ─────────────────────
    const sectorStats = await Loan.aggregate([
      { $match: { status: "Approved" } },
      {
        $group: {
          _id: "$sector",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // ── 4. Regional Stats (Bar Chart) ──────────────────────────
    const regionalStats = await Loan.aggregate([
      { $match: { status: "Approved" } },
      {
        $group: {
          _id: "$region",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // ── 5. Monthly Trends (Stacked Bar + Line Chart) ────────────
    const { sector: filterSector, region: filterRegion } = req.query;

    const monthlyMatchStage = {};
    if (filterSector) monthlyMatchStage.sector = filterSector;
    if (filterRegion) monthlyMatchStage.region = filterRegion;

    const monthlyTrends = await Loan.aggregate([
      ...(Object.keys(monthlyMatchStage).length
        ? [{ $match: monthlyMatchStage }]
        : []),
      {
        $group: {
          _id: {
            year: { $year: "$appliedDate" },
            month: { $month: "$appliedDate" },
            status: "$status",
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // ── 5b. Regional breakdown filtered by sector ──────────────
    const regionalBySector = filterSector
      ? await Loan.aggregate([
          { $match: { status: "Approved", sector: filterSector } },
          {
            $group: {
              _id: "$region",
              totalAmount: { $sum: "$amount" },
              count: { $sum: 1 },
            },
          },
          { $sort: { totalAmount: -1 } },
        ])
      : null;

    // Reshape monthly trends into chart-friendly format
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
    const monthlyMap = {};
    monthlyTrends.forEach(({ _id, count, totalAmount }) => {
      const key = `${_id.year}-${String(_id.month).padStart(2, "0")}`;
      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          month: monthNames[_id.month - 1],
          year: _id.year,
          Pending: 0,
          "Under Review": 0,
          Approved: 0,
          Rejected: 0,
          total: 0,
          approvedAmount: 0,
        };
      }
      monthlyMap[key][_id.status] = count;
      monthlyMap[key].total += count;
      if (_id.status === "Approved") {
        monthlyMap[key].approvedAmount += totalAmount;
      }
    });
    const monthlyData = Object.values(monthlyMap).slice(-12); // last 12 months

    // ── 6. Recent Applications (last 10) ───────────────────────
    const recentApplications = await Loan.find()
      .sort({ appliedDate: -1 })
      .limit(10)
      .select("applicantName sector region amount status appliedDate");

    // ── 7. Recent Approvals (last 5) ───────────────────────────
    const recentApprovals = await Loan.find({ status: "Approved" })
      .sort({ updatedAt: -1 })
      .limit(5)
      .select("applicantName sector region amount appliedDate");

    // ── Response ───────────────────────────────────────────────
    res.status(200).json({
      kpi: {
        totalApplications,
        pending,
        underReview,
        approved,
        rejected,
        totalAllocation,
        approvedAmount,
        balanceAmount,
        utilizationPct: Math.round(utilizationPct * 10) / 10,
      },
      sectorStats,
      regionalStats,
      monthlyData,
      recentApplications,
      recentApprovals,
      regionalBySector,
    });
  } catch (err) {
    console.error("Dashboard Stats Error:", err);
    res.status(500).json({ message: "Analytics Engine Error" });
  }
};
