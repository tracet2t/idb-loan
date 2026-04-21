import Region from "../models/region.js";
import Sector from "../models/sector.js";

/**
 * @desc    Get all regions from database
 * @route   GET /api/loans/regions
 * @access  Protected (Logged in users)
 */
export const getRegions = async (req, res) => {
  try {
    const regions = await Region.find().sort({ name: 1 });
    
    if (!regions) {
      return res.status(200).json([]);
    }

    res.status(200).json(regions);
  } catch (error) {
    console.error("Error in getRegions controller:", error);
    res.status(500).json({ 
      message: "Failed to fetch regions from database",
      error: error.message 
    });
  }
};

/**
 * @desc    Get all sectors from database
 * @route   GET /api/loans/sectors
 * @access  Protected (Logged in users)
 */
export const getSectors = async (req, res) => {
  try {
    const sectors = await Sector.find().sort({ name: 1 });
    
    if (!sectors) {
      return res.status(200).json([]);
    }

    res.status(200).json(sectors);
  } catch (error) {
    console.error("Error in getSectors controller:", error);
    res.status(500).json({ 
      message: "Failed to fetch sectors from database",
      error: error.message 
    });
  }
};