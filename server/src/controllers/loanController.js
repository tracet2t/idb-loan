import Loan from "../models/loan.js";

export const getLoans = async (req, res) => {
  try {
    const loans = await Loan.find().sort({ createdAt: -1 });
    res.status(200).json(loans);
  } catch (error) {
    res.status(500).json({ message: "Error fetching loans" });
  }
};

export const updateLoanStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const updatedLoan = await Loan.findByIdAndUpdate(id, { status }, { new: true });
    res.status(200).json(updatedLoan);
  } catch (error) {
    res.status(500).json({ message: "Failed to update status" });
  }
};

// Create a new loan application
export const createLoan = async (req, res) => {
  try {
    const newLoan = new Loan(req.body);
    await newLoan.save();
    res.status(201).json(newLoan);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

