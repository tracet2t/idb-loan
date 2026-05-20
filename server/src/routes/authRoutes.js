import express from "express";
import { login, completeProfile } from "../controllers/authController.js";
import { protect } from "../middleware/authMiddleware.js"; // Import it here

const router = express.Router();

router.post("/login", login);

// This route is now PROTECTED
router.post("/complete-profile", protect, completeProfile);

export default router;