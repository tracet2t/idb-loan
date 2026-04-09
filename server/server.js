// server.js
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./src/routes/authRoutes.js";
import loanRoutes from "./src/routes/loanRoutes.js";
import referenceRoutes from "./src/routes/referenceRoutes.js";
import statsRoutes from "./src/routes/statsRoutes.js";

// 1. Load Environment Variables
dotenv.config();

const app = express();

// 2. Advanced CORS Configuration
// This allows your Vite frontend (5173) to talk to this backend (5000)
app.use(cors({
  origin: "http://localhost:5173", // Explicitly allow your frontend
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true // Required since your axios.js has withCredentials: true
}));

// 3. Built-in Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. API Routes
// Your frontend calls: http://localhost:5000/api/auth/login
app.use("/api/auth", authRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/reference", referenceRoutes);

// 5. Health Check (Optional - good for testing)
app.get("/", (req, res) => {
  res.send("IDB Loan API is running...");
});

// 6. Database Connection
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/idb_loan_db";

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("-----------------------------------------");
    console.log("📁 MongoDB Connected: idb_loan_db");
    console.log("-----------------------------------------");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:");
    console.error(err.message);
  });

// 7. Start the Server
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

app.listen(PORT, () => {
  console.log(`🚀 Server initialized in ${NODE_ENV} mode`);
  console.log(`📡 Listening on: http://localhost:${PORT}`);
  console.log("-----------------------------------------");
});