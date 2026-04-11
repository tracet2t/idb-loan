import Loan from "../models/loan.js";

// GET all loans with filters, search, pagination
export const getLoans = async (req, res) => {
  try {
    const { status, region, sector, priority, search, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status)   filter.status = status;
    if (region)   filter.region = region;
    if (sector)   filter.sector = sector;
    if (priority) filter.priority = priority === "true";
    if (search) {
      filter.$or = [
        { applicantName: { $regex: search, $options: "i" } },
        { nic:           { $regex: search, $options: "i" } },
      ];
    }
    const total = await Loan.countDocuments(filter);
    const loans = await Loan.find(filter)
      .populate("createdBy", "email role")
      .sort({ appliedDate: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.status(200).json({
      loans,
      pagination: {
        total,
        page:       Number(page),
        limit:      Number(limit),
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
    const loan = await Loan.findById(req.params.id)
      .populate("createdBy", "email role");
    if (!loan) return res.status(404).json({ message: "Loan not found" });
    res.status(200).json(loan);
  } catch (error) {
    res.status(500).json({ message: "Error fetching loan" });
  }
};

// POST create new loan (with file uploads)
export const createLoan = async (req, res) => {
  try {
    const {
      applicantName, nic, region, sector, amount, loanReason
    } = req.body;

    // Build proof documents array from uploaded files
    const proofDocuments = req.files
      ? req.files.map((file) => ({
          fileName:  file.originalname,
          filePath:  file.path,
          fileType:  file.mimetype,
        }))
      : [];

    const newLoan = new Loan({
      applicantName,
      nic,
      region,
      sector,
      amount:        Number(amount),
      loanReason,
      status:        "Pending",
      createdBy:     req.user._id,
      proofDocuments,
    });

    await newLoan.save();
    res.status(201).json(newLoan);

  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "A loan with this NIC already exists." });
    }
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
      { new: true }
    );
    if (!updatedLoan) return res.status(404).json({ message: "Loan not found" });
    res.status(200).json(updatedLoan);
  } catch (error) {
    res.status(500).json({ message: "Failed to update status" });
  }
};

// GET loan stats
export const getLoanStats = async (req, res) => {
  try {
    const total    = await Loan.countDocuments();
    const pending  = await Loan.countDocuments({ status: "Pending" });
    const approved = await Loan.countDocuments({ status: "Approved" });
    const rejected = await Loan.countDocuments({ status: "Rejected" });
    const priority = await Loan.countDocuments({ priority: true });
    res.status(200).json({ total, pending, approved, rejected, priority });
  } catch (error) {
    res.status(500).json({ message: "Error fetching stats" });
  }
};