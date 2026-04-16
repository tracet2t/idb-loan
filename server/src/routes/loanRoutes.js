import express from "express";
import { getLoans, createLoan, updateLoanStatus,  updateLoanDetails  } from "../controllers/loanController.js";

const router = express.Router();

// GET all loans for the dashboard table
router.get("/", getLoans);

// POST a new loan (for the application form later)
router.post("/apply", createLoan);

// PATCH to update status (Pending -> Approved)
router.patch("/:id/status", updateLoanStatus);

// PATCH to update or edit the pending loan's deatil
router.patch("/:id/details", updateLoanDetails);  // ← add this line

export default router;