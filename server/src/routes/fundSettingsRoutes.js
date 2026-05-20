import express from "express";
import {
  getFundSettings,
  getAllFundSettings,
  getFundChartData,
  createFundSettings,
  updateFundSettings,
  deleteFundSettings,
} from "../controllers/fundSettingsController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", protect, getFundSettings);
router.get("/history", protect, getAllFundSettings);
router.get("/chart-data", protect, getFundChartData);
router.post("/", protect, createFundSettings);
router.patch("/:id", protect, updateFundSettings);
router.delete("/:id", protect, deleteFundSettings);

export default router;
