import express from "express";
import {
  getLoans,
  getLoanById,
  createLoan,
  updateLoanStatus,
  getLoanStats,
} from "../controllers/loanController.js";
import upload from "../middleware/uploadMiddleware.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/stats", protect, getLoanStats);
router.get("/", protect, getLoans);
router.get("/:id", protect, getLoanById);
router.post("/apply", protect, upload.array("proofDocuments", 5), createLoan);
router.patch("/:id/status", protect, updateLoanStatus);

export default router;
