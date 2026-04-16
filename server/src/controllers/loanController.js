import Loan from "../models/loan.js";

// GET all loans with filters, search, pagination
export const getLoans = async (req, res) => {
  try {
    const {
      status,
      region,
      sector,
      priority,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter object
    const filter = {};
    if (status) filter.status = status;
    if (region) filter.region = region;
    if (sector) filter.sector = sector;
    if (priority) filter.priority = priority === "true";

    // Search by applicant name OR nic
    if (search) {
      filter.$or = [
        { applicantName: { $regex: search, $options: "i" } },
        { nic: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Loan.countDocuments(filter);
    const loans = await Loan.find(filter)
      .sort({ appliedDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      loans,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching loans" });
  }
};

// GET single loan by ID
export const getLoanById = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    res.status(200).json(loan);
  } catch (error) {
    res.status(500).json({ message: "Error fetching loan" });
  }
};

// POST create new loan
export const createLoan = async (req, res) => {
  try {
    const newLoan = new Loan(req.body);
    await newLoan.save();
    res.status(201).json(newLoan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH update loan status
export const updateLoanStatus = async (req, res) => {
  try {
    const { status, remarks } = req.body;
    const updatedLoan = await Loan.findByIdAndUpdate(
      req.params.id,
      { status, remarks },
      { new: true },
    );
    if (!updatedLoan)
      return res.status(404).json({ message: "Loan not found" });
    res.status(200).json(updatedLoan);
  } catch (error) {
    res.status(500).json({ message: "Failed to update status" });
  }
};

// PATCH update full loan details (Pending loans only)
export const updateLoanDetails = async (req, res) => {
  try {
    const loan = await Loan.findById(req.params.id);
    if (!loan) return res.status(404).json({ message: "Loan not found" });

    if (loan.status !== "Pending") {
      return res.status(403).json({ message: "Only Pending loans can be edited" });
    }

    const allowedFields = [
      "applicantName", "nic", "contactNumber",
      "region", "sector", "amount",
      "permanentAddress", "loanPurpose", "remarks", "priority"
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) loan[field] = req.body[field];
    });

    await loan.save();
    res.status(200).json(loan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// GET loan stats for dashboard
export const getLoanStats = async (req, res) => {
  try {
    const total = await Loan.countDocuments();
    const pending = await Loan.countDocuments({ status: "Pending" });
    const approved = await Loan.countDocuments({ status: "Approved" });
    const rejected = await Loan.countDocuments({ status: "Rejected" });
    const priority = await Loan.countDocuments({ priority: true });

    res.status(200).json({ total, pending, approved, rejected, priority });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats" });
  }
};
