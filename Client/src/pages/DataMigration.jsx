import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileUp,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Send,
  Trash2,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Database,
  Info,
} from "lucide-react";
import api from "../api/axios";
import toast, { Toaster } from "react-hot-toast";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ── Helpers ──────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(n);

const MIGRATION_STATUS_STYLES = {
  Migrated: "bg-blue-100 text-blue-700",
  "Sent to Queue": "bg-emerald-100 text-emerald-700",
  Failed: "bg-red-100 text-red-700",
};

const STATUS_STYLES = {
  Approved: "bg-emerald-100 text-emerald-700",
  Pending: "bg-yellow-100 text-yellow-700",
  "Under Review": "bg-blue-100 text-blue-700",
  Rejected: "bg-red-100 text-red-700",
};

export default function DataMigration() {
  const navigate = useNavigate();
  const fileRef = useRef(null);

  // ── Tabs ──────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState(() => {
    return sessionStorage.getItem("migrationTab") || "upload";
  });

  // ── Upload state ──────────────────────────────────────────
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // ── History state ─────────────────────────────────────────
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    totalPages: 1,
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const [sending, setSending] = useState(false);
  const [batches, setBatches] = useState([]);
  const [filterBatch, setFilterBatch] = useState("");
  const [search, setSearch] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [filterSector, setFilterSector] = useState("");

  // ── Fetch ─────────────────────────────────────────────────
  const fetchRecords = useCallback(
    async (page = 1) => {
      try {
        setLoading(true);
        const params = { page, limit: 15 };
        if (filterBatch) params.batchId = filterBatch;
        if (search) params.search = search;
        if (filterRegion) params.region = filterRegion;
        if (filterSector) params.sector = filterSector;
        const res = await api.get("/migration", { params });
        setRecords(res.data.records);
        setPagination(res.data.pagination);
      } catch (err) {
        toast.error("Failed to load migration records.");
      } finally {
        setLoading(false);
      }
    },
    [filterBatch, search, filterRegion, filterSector],
  );

  const fetchBatches = useCallback(async () => {
    try {
      const res = await api.get("/migration/batches");
      setBatches(res.data);
    } catch (err) {
      console.error("Failed to fetch batches");
    }
  }, []);

  useEffect(() => {
    fetchRecords();
    fetchBatches();
  }, [fetchRecords, fetchBatches]);

  // ── File handling ─────────────────────────────────────────
  const handleFileSelect = (file) => {
    if (!file) return;
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
    ];
    if (!allowed.includes(file.type)) {
      toast.error("Only Excel files (.xlsx, .xls) are allowed.");
      return;
    }
    setSelectedFile(file);
    setUploadResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await api.post("/migration/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setUploadResult(res.data);
      setSelectedFile(null);
      fetchRecords();
      fetchBatches();
      if (res.data.imported > 0)
        toast.success(`${res.data.imported} records imported successfully!`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  // ── Selection ─────────────────────────────────────────────
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    const available = records.filter((r) => !r.sentToQueue).map((r) => r._id);
    setSelectedIds(selectedIds.length === available.length ? [] : available);
  };

  // ── Send to queue ─────────────────────────────────────────
  const handleSendToQueue = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one record.");
      return;
    }
    try {
      setSending(true);
      const res = await api.post("/migration/send-to-queue", {
        ids: selectedIds,
      });
      toast.success(res.data.message);
      setSelectedIds([]);
      fetchRecords();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send to queue.");
    } finally {
      setSending(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this migration record?")) return;
    try {
      await api.delete(`/migration/${id}`);
      toast.success("Record deleted.");
      fetchRecords();
    } catch (err) {
      toast.error("Failed to delete record.");
    }
  };

  // ── Download template ─────────────────────────────────────
  const downloadTemplate = async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Loan Migration Template");
    sheet.columns = [
      { header: "#", key: "serial", width: 6 },
      { header: "Applicant Name", key: "applicantName", width: 26 },
      { header: "NIC", key: "nic", width: 16 },
      { header: "Region", key: "region", width: 18 },
      { header: "Sector", key: "sector", width: 18 },
      { header: "Amount (LKR)", key: "amount", width: 16 },
      { header: "Status", key: "status", width: 14 },
      { header: "Applied Date", key: "appliedDate", width: 16 },
      { header: "Priority", key: "priority", width: 10 },
    ];
    sheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF1A2535" },
      };
      cell.alignment = { vertical: "middle", horizontal: "center" };
    });
    sheet.getRow(1).height = 24;
    sheet.addRow({
      serial: 1,
      applicantName: "Mohamed Farhan",
      nic: "901234567V",
      region: "Northern",
      sector: "Agriculture",
      amount: 500000,
      status: "Pending",
      appliedDate: "2026-01-15",
      priority: "No",
    });
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf]), "IDB_Migration_Template.xlsx");
  };

  const displayRecords =
    activeTab === "sent"
      ? records.filter((r) => r.sentToQueue === true)
      : records.filter(
          (r) =>
            !r.sentToQueue ||
            r.sentToQueue === false ||
            r.migrationStatus === "Migrated",
        );

  return (
    <div className="p-8 max-w-screen-xl mx-auto">
      <Toaster position="top-right" />

      {/* ── Page Header ──────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Data Migration</h1>
        <p className="text-gray-500 text-sm">
          Import historical loan data from Excel into the system.
        </p>
      </div>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {[
          { id: "upload", label: "Upload Excel", icon: Upload },
          { id: "history", label: "Migration History", icon: Database },
          { id: "sent", label: "Sent to Queue", icon: CheckCircle },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              sessionStorage.setItem("migrationTab", tab.id);
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-white text-[#1a2535] shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon size={15} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════
          TAB 1 — UPLOAD
      ══════════════════════════════════════════════════ */}
      {activeTab === "upload" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left — Drop zone */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-700">
                  Upload Excel File
                </h2>
                <p className="text-xs text-gray-400">
                  Drag & drop or click to browse
                </p>
              </div>
              <button
                onClick={downloadTemplate}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 transition-all"
              >
                <Download size={13} /> Template
              </button>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
                dragOver
                  ? "border-[#e09510] bg-amber-50"
                  : selectedFile
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-gray-200 hover:border-[#e09510] hover:bg-amber-50/30"
              }`}
            >
              <input
                ref={fileRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
              {selectedFile ? (
                <>
                  <FileText
                    size={36}
                    className="text-emerald-500 mx-auto mb-3"
                  />
                  <p className="font-semibold text-gray-700 text-sm">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {(selectedFile.size / 1024).toFixed(1)} KB — Ready to upload
                  </p>
                </>
              ) : (
                <>
                  <FileUp size={36} className="text-gray-300 mx-auto mb-3" />
                  <p className="font-semibold text-gray-600 text-sm">
                    Drag & drop your Excel file here
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    .xlsx, .xls supported - max 10MB
                  </p>
                </>
              )}
            </div>

            {/* Upload Button */}
            {selectedFile && (
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-[#e09510] hover:bg-[#c8840e] text-white font-semibold text-sm transition-all disabled:opacity-60"
              >
                {uploading ? (
                  <>
                    <RefreshCw size={15} className="animate-spin" />{" "}
                    Processing...
                  </>
                ) : (
                  <>
                    <Upload size={15} /> Import Excel Data
                  </>
                )}
              </button>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <div className="mt-4 space-y-3">
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle size={16} className="text-emerald-500" />
                    <p className="font-semibold text-emerald-700 text-sm">
                      Import Complete
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-white rounded-lg p-2 border border-emerald-100">
                      <p className="text-xl font-bold text-gray-800">
                        {uploadResult.total}
                      </p>
                      <p className="text-xs text-gray-400">Total</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-emerald-100">
                      <p className="text-xl font-bold text-emerald-600">
                        {uploadResult.imported}
                      </p>
                      <p className="text-xs text-gray-400">Imported</p>
                    </div>
                    <div className="bg-white rounded-lg p-2 border border-emerald-100">
                      <p className="text-xl font-bold text-red-500">
                        {uploadResult.skipped}
                      </p>
                      <p className="text-xs text-gray-400">Skipped</p>
                    </div>
                  </div>
                </div>
                {uploadResult.errors?.length > 0 && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle size={14} className="text-red-500" />
                      <p className="text-xs font-semibold text-red-700">
                        Skipped Rows
                      </p>
                    </div>
                    <ul className="space-y-1 max-h-28 overflow-y-auto">
                      {uploadResult.errors.map((err, i) => (
                        <li key={i} className="text-xs text-red-600">
                          • {err}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <button
                  onClick={() => setActiveTab("history")}
                  className="w-full py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  View Migration History →
                </button>
              </div>
            )}
          </div>

          {/* Right — Format guide */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Info size={16} className="text-[#e09510]" />
                <h2 className="text-sm font-bold text-gray-700">
                  Excel Format Requirements
                </h2>
              </div>
              <div className="space-y-2">
                {[
                  { label: "Applicant Name", required: true },
                  { label: "NIC", required: true },
                  { label: "Region", required: true },
                  { label: "Sector", required: true },
                  { label: "Amount (LKR)", required: true },
                  { label: "Status", required: false },
                  { label: "Applied Date", required: false },
                  { label: "Priority", required: false },
                ].map((field) => (
                  <div
                    key={field.label}
                    className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0"
                  >
                    <span className="text-sm text-gray-600">{field.label}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        field.required
                          ? "bg-red-100 text-red-600"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {field.required ? "Required" : "Optional"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center gap-2 mb-3">
                <Database size={16} className="text-[#e09510]" />
                <h2 className="text-sm font-bold text-gray-700">
                  Migration Process
                </h2>
              </div>
              <ol className="space-y-2">
                {[
                  "Download the Excel template",
                  "Fill in loan data following the format",
                  "Upload the filled Excel file",
                  "Review imported records in Migration History",
                  "Select records and send to Loan Queue",
                ].map((step, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-gray-600"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#e09510] text-white text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          TAB 2 & 3 — HISTORY / SENT
      ══════════════════════════════════════════════════ */}
      {(activeTab === "history" || activeTab === "sent") && (
        <div>
          {/* Actions bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div className="flex flex-wrap gap-3 items-center">
              {/* Search */}
              <input
                type="text"
                placeholder="Search name or NIC..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="text-sm border border-slate-200 rounded-xl px-3 py-2 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#e09510]/30 w-52"
              />

              {/* Region filter */}
              <select
                value={filterRegion}
                onChange={(e) => setFilterRegion(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Regions</option>
                {[
                  "Northern",
                  "Southern",
                  "Eastern",
                  "Western",
                  "Central",
                  "North Central",
                  "North Western",
                  "Sabaragamuwa",
                  "Uva",
                ].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>

              {/* Sector filter */}
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Sectors</option>
                {[
                  "Agriculture",
                  "Fisheries",
                  "SME",
                  "Technology",
                  "Education",
                  "Healthcare",
                  "Manufacturing",
                  "Other",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* Batch filter */}
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">All Batches</option>
                {batches.map((b) => (
                  <option key={b._id} value={b._id}>
                    {new Date(b.createdAt).toLocaleDateString("en-LK")} (
                    {b.total} records)
                  </option>
                ))}
              </select>

              {/* Clear filters */}
              {(search || filterRegion || filterSector || filterBatch) && (
                <button
                  onClick={() => {
                    setSearch("");
                    setFilterRegion("");
                    setFilterSector("");
                    setFilterBatch("");
                  }}
                  className="text-xs text-red-500 hover:underline"
                >
                  Clear filters
                </button>
              )}

              <button
                onClick={() => fetchRecords()}
                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all text-gray-500"
                title="Refresh"
              >
                <RefreshCw size={14} />
              </button>
              <span className="text-xs text-gray-400">
                {pagination.total} records
              </span>
            </div>

            {activeTab === "history" && (
              <button
                onClick={handleSendToQueue}
                disabled={sending || selectedIds.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e09510] hover:bg-[#c8840e] text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-sm"
              >
                {sending ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Sending...
                  </>
                ) : (
                  <>
                    <Send size={14} /> Send{" "}
                    {selectedIds.length > 0 ? `(${selectedIds.length})` : ""} to
                    Loan Queue
                  </>
                )}
              </button>
            )}
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {activeTab === "history" && (
                    <th className="px-5 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={
                          selectedIds.length > 0 &&
                          selectedIds.length ===
                            records.filter((r) => !r.sentToQueue).length
                        }
                        onChange={toggleSelectAll}
                        className="rounded border-gray-300 accent-[#e09510]"
                      />
                    </th>
                  )}
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">
                    #
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">
                    Applicant Name
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">
                    NIC
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">
                    Region
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">
                    Sector
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">
                    Amount
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">
                    Migration
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-bold text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="border-b border-slate-100">
                      {[...Array(activeTab === "history" ? 10 : 9)].map(
                        (_, j) => (
                          <td key={j} className="px-5 py-4">
                            <div className="h-4 bg-gray-100 rounded animate-pulse" />
                          </td>
                        ),
                      )}
                    </tr>
                  ))
                ) : displayRecords.length === 0 ? (
                  <tr>
                    <td
                      colSpan={activeTab === "history" ? 10 : 9}
                      className="px-5 py-20 text-center"
                    >
                      <Database
                        size={36}
                        className="mx-auto mb-3 text-gray-200"
                      />
                      <p className="font-medium text-gray-400 text-sm">
                        No records found
                      </p>
                      {activeTab === "history" && (
                        <button
                          onClick={() => setActiveTab("upload")}
                          className="mt-2 text-xs text-[#e09510] underline"
                        >
                          Upload an Excel file to get started
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  displayRecords.map((record, i) => (
                    <tr
                      key={record._id}
                      className={`border-b border-slate-100 hover:bg-slate-50/70 transition-colors ${
                        selectedIds.includes(record._id) ? "bg-amber-50/50" : ""
                      }`}
                    >
                      {activeTab === "history" && (
                        <td className="px-5 py-4">
                          {!record.sentToQueue && (
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(record._id)}
                              onChange={() => toggleSelect(record._id)}
                              className="rounded border-gray-300 accent-[#e09510]"
                            />
                          )}
                        </td>
                      )}
                      <td className="px-5 py-4 text-gray-400 text-xs font-mono">
                        {record.rowNumber || i + 1}
                      </td>
                      <td className="px-5 py-4 font-medium text-gray-700">
                        {record.applicantName}
                      </td>
                      <td className="px-5 py-4 text-gray-500 font-mono text-xs">
                        {record.nic}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {record.region}
                      </td>
                      <td className="px-5 py-4 text-gray-500">
                        {record.sector}
                      </td>
                      <td className="px-5 py-4 font-semibold text-gray-700">
                        {fmt(record.amount)}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_STYLES[record.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {record.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${MIGRATION_STATUS_STYLES[record.migrationStatus]}`}
                        >
                          {record.migrationStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          {activeTab === "sent" && (
                            <button
                              onClick={() => navigate("/applications")}
                              title="View in Loan Queue"
                              className="p-1.5 rounded-lg border border-blue-200 text-blue-500 hover:bg-blue-50 transition-all"
                            >
                              <Eye size={13} />
                            </button>
                          )}
                          {!record.sentToQueue && (
                            <button
                              onClick={() => handleDelete(record._id)}
                              title="Delete record"
                              className="p-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">
                  {pagination.total} total records
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => fetchRecords(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs text-gray-600">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => fetchRecords(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
