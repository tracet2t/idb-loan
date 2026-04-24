import Region from "../models/region.js";
import Sector from "../models/sector.js";

// ── REGIONS ──────────────────────────────

// GET all regions
export const getRegions = async (req, res) => {
  try {
    const regions = await Region.find().sort({ name: 1 });
    res.status(200).json(regions);
  } catch (error) {
    res.status(500).json({ message: "Error fetching regions" });
  }
};

// POST create region
export const createRegion = async (req, res) => {
  try {
    const { name } = req.body;
    const region = new Region({ name });
    await region.save();
    res.status(201).json(region);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Region already exists" });
    }
    res.status(400).json({ message: error.message });
  }
};

// PATCH update region name
export const updateRegion = async (req, res) => {
  try {
    const { name } = req.body;
    const region = await Region.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!region) return res.status(404).json({ message: "Region not found" });
    res.status(200).json(region);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH deactivate region
export const deactivateRegion = async (req, res) => {
  try {
    const region = await Region.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!region) return res.status(404).json({ message: "Region not found" });
    res.status(200).json({ message: "Region deactivated", region });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE region
export const deleteRegion = async (req, res) => {
  try {
    const region = await Region.findByIdAndDelete(req.params.id);
    if (!region) return res.status(404).json({ message: "Region not found" });
    res.status(200).json({ message: "Region deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ── SECTORS ──────────────────────────────

// GET all sectors
export const getSectors = async (req, res) => {
  try {
    const sectors = await Sector.find().sort({ name: 1 });
    res.status(200).json(sectors);
  } catch (error) {
    res.status(500).json({ message: "Error fetching sectors" });
  }
};

// POST create sector
export const createSector = async (req, res) => {
  try {
    const { name } = req.body;
    const sector = new Sector({ name });
    await sector.save();
    res.status(201).json(sector);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Sector already exists" });
    }
    res.status(400).json({ message: error.message });
  }
};

// PATCH update sector name
export const updateSector = async (req, res) => {
  try {
    const { name } = req.body;
    const sector = await Sector.findByIdAndUpdate(
      req.params.id,
      { name },
      { new: true }
    );
    if (!sector) return res.status(404).json({ message: "Sector not found" });
    res.status(200).json(sector);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PATCH deactivate sector
export const deactivateSector = async (req, res) => {
  try {
    const sector = await Sector.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!sector) return res.status(404).json({ message: "Sector not found" });
    res.status(200).json({ message: "Sector deactivated", sector });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE sector
export const deleteSector = async (req, res) => {
  try {
    const sector = await Sector.findByIdAndDelete(req.params.id);
    if (!sector) return res.status(404).json({ message: "Sector not found" });
    res.status(200).json({ message: "Sector deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};