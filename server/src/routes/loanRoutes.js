import express from "express";
import multer from "multer";
import path from "path";
import {
  getLoans,
  createLoan,
  updateLoanStatus,
  getLoanById,
  getLoanStats,
} from "../controllers/loanController.js";

const router = express.Router();

// ── Multer Setup ──────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/proofs/");
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = /pdf|jpeg|jpg|png|xlsx|xls|doc|docx/;
  const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  if (ext) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type."), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB per file
  fileFilter,
});

// ── Routes ────────────────────────────────────────────────────
router.get("/stats", getLoanStats);
router.get("/", getLoans);
router.get("/:id", getLoanById);
router.post("/apply", upload.array("proofDocuments", 5), createLoan);
router.patch("/:id/status", updateLoanStatus);

export default router;
