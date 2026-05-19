import MigratedLoan from "../models/migratedLoan.js";
import Loan from "../models/loan.js";
import * as XLSX from "xlsx";
import { v4 as uuidv4 } from "uuid";

// ── Helper: validate a row ────────────────────────────────────
const validateRow = (row, rowNum) => {
  const errors = [];
  if (!row.applicantName && !row["Applicant Name"])
    errors.push(`Row ${rowNum}: Applicant Name is required`);
  if (!row.nic && !row["NIC"]) errors.push(`Row ${rowNum}: NIC is required`);
  if (!row.region && !row["Region"])
    errors.push(`Row ${rowNum}: Region is required`);
  if (!row.sector && !row["Sector"])
    errors.push(`Row ${rowNum}: Sector is required`);
  const amount = row.amount || row["Amount (LKR)"] || row["Amount"];
  if (!amount || isNaN(Number(amount)))
    errors.push(`Row ${rowNum}: Valid amount is required`);
  return errors;
};

// ── Helper: normalize a row ───────────────────────────────────
const normalizeRow = (row, rowNum, batchId, userId) => {
  const amount = row.amount || row["Amount (LKR)"] || row["Amount"] || 0;
  const rawDate = row.appliedDate || row["Applied Date"] || row["Date"];
  let appliedDate = null;
  if (rawDate) {
    // Handle Excel serial date numbers
    if (typeof rawDate === "number") {
      appliedDate = new Date((rawDate - 25569) * 86400 * 1000);
    } else {
      appliedDate = new Date(rawDate);
    }
    if (isNaN(appliedDate.getTime())) appliedDate = null;
  }

  return {
    applicantName: row.applicantName || row["Applicant Name"] || "",
    nic: row.nic || row["NIC"] || "",
    region: row.region || row["Region"] || "",
    sector: row.sector || row["Sector"] || "",
    amount: Number(amount),
    status: row.status || row["Status"] || "Pending",
    priority: row.priority === true || row["Priority"] === "Yes",
    appliedDate,
    migrationStatus: "Migrated",
    migratedBy: userId,
    batchId,
    rowNumber: rowNum,
  };
};

// ── POST /api/migration/upload ────────────────────────────────
export const uploadMigration = async (req, res) => {
  try {
    if (!req.file)
      return res.status(400).json({ message: "No file uploaded." });

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0)
      return res.status(400).json({ message: "Excel file is empty." });

    const batchId = uuidv4();
    const errors = [];
    const valid = [];

    rows.forEach((row, i) => {
      const rowNum = i + 2; // Excel row (1 = header)
      const rowErrors = validateRow(row, rowNum);
      if (rowErrors.length > 0) {
        errors.push(...rowErrors);
      } else {
        valid.push(normalizeRow(row, rowNum, batchId, req.user._id));
      }
    });

    if (valid.length === 0)
      return res.status(400).json({
        message: "No valid rows found.",
        errors,
      });

    // Save valid rows to MigratedLoan collection
    const saved = await MigratedLoan.insertMany(valid);

    res.status(201).json({
      message: `Successfully imported ${saved.length} records.`,
      total: rows.length,
      imported: saved.length,
      skipped: errors.length > 0 ? rows.length - saved.length : 0,
      errors,
      batchId,
    });
  } catch (err) {
    console.error("Migration upload error:", err);
    res.status(500).json({ message: "Failed to process Excel file." });
  }
};

// ── GET /api/migration ────────────────────────────────────────
export const getMigrations = async (req, res) => {
  try {
    const {
      batchId,
      status,
      page = 1,
      limit = 20,
      search,
      region,
      sector,
    } = req.query;
    const filter = {};
    if (batchId) filter.batchId = batchId;
    if (status) filter.migrationStatus = status;
    if (region) filter.region = region;
    if (sector) filter.sector = sector;
    if (search) {
      filter.$or = [
        { applicantName: { $regex: search, $options: "i" } },
        { nic: { $regex: search, $options: "i" } },
      ];
    }

    const total = await MigratedLoan.countDocuments(filter);
    const records = await MigratedLoan.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate("migratedBy", "username email");

    res.status(200).json({
      records,
      pagination: {
        total,
        page: Number(page),
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get migrations error:", err.message);
    res.status(500).json({ message: "Failed to fetch migration records." });
  }
};

// ── GET /api/migration/batches ────────────────────────────────
export const getBatches = async (req, res) => {
  try {
    const batches = await MigratedLoan.aggregate([
      {
        $group: {
          _id: "$batchId",
          total: { $sum: 1 },
          sent: { $sum: { $cond: ["$sentToQueue", 1, 0] } },
          createdAt: { $first: "$createdAt" },
          migratedBy: { $first: "$migratedBy" },
        },
      },
      { $sort: { createdAt: -1 } },
    ]);
    res.status(200).json(batches);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch batches." });
  }
};

// ── POST /api/migration/send-to-queue ────────────────────────
export const sendToQueue = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || ids.length === 0)
      return res.status(400).json({ message: "No records selected." });

    const records = await MigratedLoan.find({
      _id: { $in: ids },
      sentToQueue: false,
    });

    if (records.length === 0)
      return res.status(400).json({ message: "No valid records to send." });

    const loans = await Loan.insertMany(
      records.map((r) => ({
        applicantName: r.applicantName,
        nic: r.nic + "_migrated_" + Date.now(), // avoid unique conflict
        region: r.region,
        sector: r.sector,
        amount: r.amount,
        status: "Pending",
        appliedDate: r.appliedDate || new Date(),
        loanPurpose: "Migrated from Excel data",
      })),
    );

    // Update migration records
    await Promise.all(
      records.map((r, i) =>
        MigratedLoan.findByIdAndUpdate(r._id, {
          sentToQueue: true,
          sentAt: new Date(),
          migrationStatus: "Sent to Queue",
          loanRef: loans[i]._id,
        }),
      ),
    );

    res.status(200).json({
      message: `${loans.length} records sent to Loan Queue successfully.`,
      count: loans.length,
    });
  } catch (err) {
    console.error("Send to queue error:", err);
    res.status(500).json({ message: "Failed to send records to queue." });
  }
};

// ── DELETE /api/migration/:id ─────────────────────────────────
export const deleteMigration = async (req, res) => {
  try {
    const deleted = await MigratedLoan.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Record not found." });
    res.status(200).json({ message: "Record deleted." });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete record." });
  }
};
