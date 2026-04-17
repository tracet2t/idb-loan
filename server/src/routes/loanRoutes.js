// import express from "express";
// import { getLoans, createLoan, updateLoanStatus,  updateLoanDetails  } from "../controllers/loanController.js";
// import { getRegions, getSectors } from "../controllers/metadataController.js";
// import upload from '../middleware/upload.js';
// const router = express.Router();


// // GET all loans for the dashboard table
// router.get("/", getLoans);

// router.get("/regions", getRegions);

// router.get("/sectors", getSectors);


// // POST a new loan (for the application form later)
// router.post("/apply", createLoan);

// router.post('/apply', upload.array('attachments', 10), createLoan);


// // PATCH to update status (Pending -> Approved)
// router.patch("/:id/status", updateLoanStatus);

// // PATCH to update or edit the pending loan's deatil
// router.patch("/:id/details", updateLoanDetails);  

// export default router;

import express from "express";
import { 
  getLoans,
  getLoanById, 
  createLoan, 
  updateLoanStatus, 
  updateLoanDetails,
  getLoanStats 
} from "../controllers/loanController.js";
import { getRegions, getSectors } from "../controllers/metadataController.js";
import upload from '../middleware/upload.js';

const router = express.Router();

// GET routes
router.get("/", getLoans);
router.get("/regions", getRegions);
router.get("/sectors", getSectors);
router.get("/stats", getLoanStats);
router.get("/:id", getLoanById);

router.post('/apply', upload.array('attachments', 10), createLoan);

// PATCH routes
router.patch("/:id/status", updateLoanStatus);
router.patch("/:id/details", updateLoanDetails); 
router.patch("/:id/approve", updateLoanStatus);

export default router;