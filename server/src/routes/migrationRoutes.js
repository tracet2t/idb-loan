import express from "express";
import multer from "multer";
import {
  uploadMigration,
  getMigrations,
  getBatches,
  sendToQueue,
  deleteMigration,
} from "../controllers/migrationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Multer — store file in memory (no disk)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only Excel files (.xlsx, .xls) are allowed."), false);
    }
  },
});

router.post("/upload", protect, upload.single("file"), uploadMigration);
router.get("/", protect, getMigrations);
router.get("/batches", protect, getBatches);
router.post("/send-to-queue", protect, sendToQueue);
router.delete("/:id", protect, deleteMigration);

export default router;
