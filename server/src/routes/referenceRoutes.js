import express from "express";
import {
  getRegions, createRegion, updateRegion, deactivateRegion, deleteRegion,
  getSectors, createSector, updateSector, deactivateSector, deleteSector,
} from "../controllers/referenceController.js";

const router = express.Router();

// ── REGION ROUTES ──
router.get("/regions",                  getRegions);
router.post("/regions",                 createRegion);
router.patch("/regions/:id",            updateRegion);
router.patch("/regions/:id/deactivate", deactivateRegion);
router.delete("/regions/:id",           deleteRegion);

// ── SECTOR ROUTES ──
router.get("/sectors",                  getSectors);
router.post("/sectors",                 createSector);
router.patch("/sectors/:id",            updateSector);
router.patch("/sectors/:id/deactivate", deactivateSector);
router.delete("/sectors/:id",           deleteSector);

export default router;