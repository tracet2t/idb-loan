import mongoose from "mongoose";
import Region from "../models/region.js";
import Sector from "../models/sector.js";
import dotenv from "dotenv";
dotenv.config();

const seedReference = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("🌱 Connected for Reference Seeding...");

    await Region.deleteMany();
    await Sector.deleteMany();

    await Region.insertMany([
      { name: "Central" },
      { name: "Eastern" },
      { name: "North Central" },
      { name: "North Western" },
      { name: "Northern" },
      { name: "Sabaragamuwa" },
      { name: "Southern" },
      { name: "Uva" },
      { name: "Western" },
    ]);
    console.log("✅ 9 Regions seeded!");

    await Sector.insertMany([
      { name: "Agriculture" },
      { name: "Education" },
      { name: "Fisheries" },
      { name: "Healthcare" },
      { name: "Manufacturing" },
      { name: "SME" },
      { name: "Technology" },
    ]);
    console.log("✅ 7 Sectors seeded!");

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🎉 Reference Data Seeded!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    process.exit();
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
};

seedReference();