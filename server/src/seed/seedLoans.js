import mongoose from "mongoose";
import Loan from "../models/loan.js";
import dotenv from "dotenv";
dotenv.config();

const seedLoans = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🌱 MongoDB Connected for Loan Seeding...");

    // Clear existing loans only
    await Loan.deleteMany();
    console.log("🗑️  Cleared existing loans...");

    // Insert mock loans
    await Loan.insertMany([
      {
        applicantName: "Mohamed Farhan",
        nic: "901234567V",
        region: "Northern",
        sector: "Agriculture",
        amount: 500000,
        status: "Pending",
        priority: true,
        appliedDate: new Date("2025-01-10"),
      },
      {
        applicantName: "Dilani Perera",
        nic: "885432167V",
        region: "Southern",
        sector: "Fisheries",
        amount: 750000,
        status: "Approved",
        priority: false,
        appliedDate: new Date("2025-01-15"),
      },
      {
        applicantName: "Kamal Rathnayake",
        nic: "920981234V",
        region: "Central",
        sector: "SME",
        amount: 350000,
        status: "Pending",
        priority: false,
        appliedDate: new Date("2025-01-20"),
      },
      {
        applicantName: "Nisha Amarasinghe",
        nic: "956712340V",
        region: "Western",
        sector: "Agriculture",
        amount: 200000,
        status: "Approved",
        priority: false,
        appliedDate: new Date("2025-01-22"),
      },
      {
        applicantName: "Saman Bandara",
        nic: "870345621V",
        region: "Eastern",
        sector: "Fisheries",
        amount: 900000,
        status: "Pending",
        priority: true,
        appliedDate: new Date("2025-02-01"),
      },
      {
        applicantName: "Fathima Zahra",
        nic: "991122334V",
        region: "Northern",
        sector: "SME",
        amount: 450000,
        status: "Rejected",
        priority: false,
        appliedDate: new Date("2025-02-05"),
      },
      {
        applicantName: "Ruwan Silva",
        nic: "780912345V",
        region: "Southern",
        sector: "Agriculture",
        amount: 600000,
        status: "Approved",
        priority: false,
        appliedDate: new Date("2025-02-10"),
      },
      {
        applicantName: "Amara Dissanayake",
        nic: "834521678V",
        region: "Sabaragamuwa",
        sector: "SME",
        amount: 300000,
        status: "Pending",
        priority: true,
        appliedDate: new Date("2025-02-14"),
      },
      {
        applicantName: "Hassan Ali",
        nic: "912345678V",
        region: "Eastern",
        sector: "Agriculture",
        amount: 850000,
        status: "Approved",
        priority: false,
        appliedDate: new Date("2025-02-18"),
      },
      {
        applicantName: "Priya Mahendran",
        nic: "945678123V",
        region: "Northern",
        sector: "Fisheries",
        amount: 400000,
        status: "Pending",
        priority: false,
        appliedDate: new Date("2025-02-20"),
      },
      {
        applicantName: "Chamara Jayawardena",
        nic: "867890123V",
        region: "Western",
        sector: "SME",
        amount: 550000,
        status: "Approved",
        priority: false,
        appliedDate: new Date("2025-03-01"),
      },
      {
        applicantName: "Nilufar Rashid",
        nic: "903456789V",
        region: "Central",
        sector: "Agriculture",
        amount: 250000,
        status: "Pending",
        priority: true,
        appliedDate: new Date("2025-03-05"),
      },
      {
        applicantName: "Tharaka Fernando",
        nic: "876543219V",
        region: "Southern",
        sector: "Fisheries",
        amount: 700000,
        status: "Rejected",
        priority: false,
        appliedDate: new Date("2025-03-10"),
      },
      {
        applicantName: "Ishara Weerasinghe",
        nic: "934567891V",
        region: "Sabaragamuwa",
        sector: "SME",
        amount: 480000,
        status: "Approved",
        priority: false,
        appliedDate: new Date("2025-03-12"),
      },
      {
        applicantName: "Roshan Perumal",
        nic: "856789012V",
        region: "Eastern",
        sector: "Agriculture",
        amount: 620000,
        status: "Pending",
        priority: true,
        appliedDate: new Date("2025-03-15"),
      },
    ]);

    console.log("✅ 15 Mock loans seeded successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      "Regions:  Northern, Southern, Central, Western, Eastern, Sabaragamuwa",
    );
    console.log("Sectors:  Agriculture, Fisheries, SME");
    console.log("Status:   Pending(7), Approved(6), Rejected(2)");
    console.log("Priority: 5 flagged as high priority");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit();
  } catch (error) {
    console.error("❌ Loan Seeding Error:", error);
    process.exit(1);
  }
};

seedLoans();
