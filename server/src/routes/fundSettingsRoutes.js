import express from "express";
import {
  getFundSettings,
  getAllFundSettings,
  setFundSettings,
} from "../controllers/fundSettingsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/history", protect, getAllFundSettings);
router.get("/", protect, getFundSettings);
router.post("/", protect, setFundSettings);

export default router;
