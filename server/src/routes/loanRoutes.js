import express from "express";
import {
  getLoans,
  getLoanById,
  createLoan,
  updateLoanStatus,
  getLoanStats,
} from "../controllers/loanController.js";

const router = express.Router();

// GET /api/loans/stats        → loan counts for dashboard
router.get("/stats", getLoanStats);

// GET /api/loans              → all loans (with filters, search, pagination)
router.get("/", getLoans);

// GET /api/loans/:id          → single loan detail
router.get("/:id", getLoanById);

// POST /api/loans/apply       → create new loan
router.post("/apply", createLoan);

// PATCH /api/loans/:id/status → approve or reject
router.patch("/:id/status", updateLoanStatus);

export default router;
