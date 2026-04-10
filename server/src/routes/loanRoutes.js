import express from "express";
import { getLoans, createLoan, updateLoanStatus } from "../controllers/loanController.js";

const router = express.Router();

// GET all loans for the dashboard table
router.get("/", getLoans);

// POST a new loan (for the application form later)
router.post("/apply", createLoan);

// PATCH to update status (Pending -> Approved)
router.patch("/:id/status", updateLoanStatus);

export default router;