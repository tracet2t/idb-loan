// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routes/authRoutes.js";
import loanRoutes from "./src/routes/loanRoutes.js";
import statsRoutes from "./src/routes/statsRoutes.js";
import userRoutes from "./src/routes/userRoutes.js";
import referenceRoutes from "./src/routes/referenceRoutes.js";
import fundSettingsRoutes from "./src/routes/fundSettingsRoutes.js";

// 1. Load Environment Variables
dotenv.config();
const app = express();

// 2. CORS Configuration
app.use(
  cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  }),
);

// 3. Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. API Routes
app.use("/api/auth", authRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/users", userRoutes);
app.use("/api/reference", referenceRoutes);
app.use("/api/fund-settings", fundSettingsRoutes);
app.use("/uploads", express.static("uploads"));

// 5. Health Check
app.get("/", (req, res) => {
  res.send("IDB Loan API is running...");
});

// 6. Database Connection
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://localhost:27017/idb_loan_db";
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("-----------------------------------------");
    console.log("📁 MongoDB Connected: idb_loan_db");
    console.log("-----------------------------------------");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err.message);
  });

// 7. Start Server
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";
app.listen(PORT, () => {
  console.log(`🚀 Server initialized in ${NODE_ENV} mode`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log("-----------------------------------------");
});
