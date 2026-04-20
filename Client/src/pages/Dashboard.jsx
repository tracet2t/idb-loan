import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle,
  Wallet,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  List,
  Star,
  Plus,
  X,
  Download,
  Activity,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  ComposedChart,
  Area,
} from "recharts";
import api from "../api/axios";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// ── Helpers ──────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-LK", {
    style: "currency",
    currency: "LKR",
    maximumFractionDigits: 0,
  }).format(n);
const fmtShort = (n) =>
  n >= 1000000
    ? `${(n / 1000000).toFixed(1)}M`
    : n >= 1000
      ? `${(n / 1000).toFixed(0)}K`
      : String(n);

const COLORS = [
  "#e09510",
  "#1a2535",
  "#10b981",
  "#3b82f6",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#84cc16",
  "#ec4899",
];

const STATUS_COLORS = {
  Pending: "bg-yellow-100 text-yellow-700",
  "Under Review": "bg-blue-100 text-blue-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-700",
};

const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

// ── Chart Download Helper ─────────────────────────────────────
const downloadChart = async (ref, filename, format) => {
  if (!ref.current) return;
  try {
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(ref.current, {
      backgroundColor: "#ffffff",
      scale: 2,
    });
    if (format === "png") {
      canvas.toBlob((blob) => saveAs(blob, `${filename}.png`));
    } else {
      const { jsPDF } = await import("jspdf");
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("landscape", "px", [
        canvas.width / 2,
        canvas.height / 2,
      ]);
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width / 2, canvas.height / 2);
      pdf.save(`${filename}.pdf`);
    }
  } catch (err) {
    console.error("Chart download error:", err);
    alert("Download failed. Please try again.");
  }
};

// ── Chart Card Wrapper ────────────────────────────────────────
const ChartCard = ({ title, subtitle, children, chartRef, filename }) => {
  const [showDownload, setShowDownload] = useState(false);
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-700">{title}</h3>
          <p className="text-xs text-gray-400">{subtitle}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowDownload(!showDownload)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition-all"
            title="Download chart"
          >
            <Download size={14} className="text-gray-500" />
          </button>
          {showDownload && (
            <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1 w-32">
              <button
                onClick={() => {
                  downloadChart(chartRef, filename, "png");
                  setShowDownload(false);
                }}
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
              >
                Download PNG
              </button>
              <button
                onClick={() => {
                  downloadChart(chartRef, filename, "pdf");
                  setShowDownload(false);
                }}
                className="w-full text-left px-4 py-2 text-xs text-gray-700 hover:bg-gray-50"
              >
                Download PDF
              </button>
            </div>
          )}
        </div>
      </div>
      {children}
    </div>
  );
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fund settings modal
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundInput, setFundInput] = useState({
    amount: "",
    year: new Date().getFullYear(),
    note: "",
  });
  const [fundLoading, setFundLoading] = useState(false);
  const [fundError, setFundError] = useState("");
  const [currentFund, setCurrentFund] = useState(null);
  const [fundHistory, setFundHistory] = useState([]);

  // Chart toggles
  const [sectorMetric, setSectorMetric] = useState("totalAmount");
  const [sectorChartType, setSectorChartType] = useState("donut"); // 'donut' or 'pie'
  const [showLegend, setShowLegend] = useState(true);
  const [sectorFilter, setSectorFilter] = useState("All");
  const [barOrientation, setBarOrientation] = useState("vertical");
  const [showGrid, setShowGrid] = useState(true);
  const [showStacked, setShowStacked] = useState(true);
  const [showTrend, setShowTrend] = useState(true);

  // Cross-filter
  const [selectedSector, setSelectedSector] = useState(null);
  const [selectedRegion, setSelectedRegion] = useState(null);

  // Chart refs for download
  const sectorRef = useRef(null);
  const regionalRef = useRef(null);
  const trendsRef = useRef(null);
  const gaugeRef = useRef(null);

  // ── Fetch dashboard data ──────────────────────────────────
  const fetchStats = useCallback(async (sector = null, region = null) => {
    try {
      setLoading(true);
      const params = {};
      if (sector) params.sector = sector;
      if (region) params.region = region;
      const [statsRes, fundRes, historyRes] = await Promise.all([
        api.get("/stats", { params }),
        api.get("/fund-settings"),
        api.get("/fund-settings/history"),
      ]);
      setData(statsRes.data);
      setCurrentFund(fundRes.data);
      setFundHistory(historyRes.data);
      setFundInput((prev) => ({
        ...prev,
        amount: fundRes.data.totalAllocation || "",
      }));
    } catch (err) {
      setError("Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Re-fetch when cross-filter changes
  useEffect(() => {
    if (selectedSector || selectedRegion) {
      fetchStats(selectedSector, selectedRegion);
    } else {
      fetchStats();
    }
  }, [selectedSector, selectedRegion]);

  // ── Save fund allocation ──────────────────────────────────
  const handleSaveFund = async () => {
    setFundError("");
    if (!fundInput.amount || Number(fundInput.amount) <= 0) {
      setFundError("Please enter a valid amount.");
      return;
    }
    try {
      setFundLoading(true);
      const res = await api.post("/fund-settings", {
        totalAllocation: Number(fundInput.amount),
        year: Number(fundInput.year),
        note: fundInput.note,
      });
      setCurrentFund(res.data);
      setShowFundModal(false);
      fetchStats();
    } catch (err) {
      setFundError(err.response?.data?.message || "Failed to save.");
    } finally {
      setFundLoading(false);
    }
  };

  // ── Gauge color ───────────────────────────────────────────
  const getGaugeColor = (pct) => {
    if (pct >= 90) return "#f43f5e";
    if (pct >= 70) return "#f97316";
    return "#10b981";
  };

  // ── Excel Export ──────────────────────────────────────────
  const exportExcel = async () => {
    if (!data) return;
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = "IDB Loan Portal";
      wb.created = new Date();

      // ── Helper: style a header row ──────────────────────────
      const styleHeader = (sheet, color = "FF1A2535") => {
        sheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: color },
          };
          cell.alignment = { vertical: "middle", horizontal: "center" };
          cell.border = {
            bottom: { style: "thin", color: { argb: "FF000000" } },
          };
        });
        sheet.getRow(1).height = 24;
      };

      const zebraRow = (row, i) => {
        if (i % 2 === 0) {
          row.eachCell((cell) => {
            cell.fill = {
              type: "pattern",
              pattern: "solid",
              fgColor: { argb: "FFF8FAFF" },
            };
          });
        }
      };

      const borderAll = (row) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "hair", color: { argb: "FFE2E8F0" } },
            bottom: { style: "hair", color: { argb: "FFE2E8F0" } },
            left: { style: "hair", color: { argb: "FFE2E8F0" } },
            right: { style: "hair", color: { argb: "FFE2E8F0" } },
          };
        });
      };

      // ── Sheet 1: KPI Summary ────────────────────────────────
      const kpiSheet = wb.addWorksheet("📊 KPI Summary");
      kpiSheet.columns = [
        { header: "Metric", key: "metric", width: 30 },
        { header: "Value", key: "value", width: 25 },
      ];
      styleHeader(kpiSheet, "FF2E7D5E");

      const kpiRows = [
        { metric: "Total Applications", value: kpi.totalApplications },
        { metric: "Pending", value: kpi.pending },
        { metric: "Under Review", value: kpi.underReview },
        { metric: "Approved", value: kpi.approved },
        { metric: "Total Allocation (LKR)", value: totalAllocation },
        { metric: "Approved Amount (LKR)", value: approvedAmount },
        { metric: "Balance Remaining (LKR)", value: balanceAmount },
        { metric: "Fund Utilization %", value: utilizationPct },
      ];
      kpiRows.forEach((r, i) => {
        const row = kpiSheet.addRow(r);
        zebraRow(row, i);
        borderAll(row);
        if (
          [
            "Total Allocation (LKR)",
            "Approved Amount (LKR)",
            "Balance Remaining (LKR)",
          ].includes(r.metric)
        ) {
          row.getCell("value").numFmt = "#,##0";
          row.getCell("value").alignment = { horizontal: "right" };
        }
        if (r.metric === "Fund Utilization %") {
          row.getCell("value").numFmt = '0.0"%"';
        }
      });
      kpiSheet.views = [{ state: "frozen", ySplit: 1 }];

      // ── Sheet 2: Sector Stats ───────────────────────────────
      const sectorSheet = wb.addWorksheet("🏭 Sector Stats");
      sectorSheet.columns = [
        { header: "#", key: "serial", width: 6 },
        { header: "Sector", key: "sector", width: 25 },
        { header: "Total Amount (LKR)", key: "totalAmount", width: 22 },
        { header: "Number of Loans", key: "count", width: 18 },
      ];
      styleHeader(sectorSheet, "FF2E7D5E");
      data.sectorStats.forEach((s, i) => {
        const row = sectorSheet.addRow({
          serial: i + 1,
          sector: s._id,
          totalAmount: s.totalAmount,
          count: s.count,
        });
        zebraRow(row, i);
        borderAll(row);
        row.getCell("totalAmount").numFmt = "#,##0";
        row.getCell("totalAmount").alignment = { horizontal: "right" };
        row.getCell("count").alignment = { horizontal: "center" };
      });
      sectorSheet.views = [{ state: "frozen", ySplit: 1 }];

      // ── Sheet 3: Regional Stats ─────────────────────────────
      const regionSheet = wb.addWorksheet("🗺️ Regional Stats");
      regionSheet.columns = [
        { header: "#", key: "serial", width: 6 },
        { header: "Region", key: "region", width: 22 },
        { header: "Total Amount (LKR)", key: "totalAmount", width: 22 },
        { header: "Number of Loans", key: "count", width: 18 },
      ];
      styleHeader(regionSheet, "FF2E7D5E");
      data.regionalStats.forEach((r, i) => {
        const row = regionSheet.addRow({
          serial: i + 1,
          region: r._id,
          totalAmount: r.totalAmount,
          count: r.count,
        });
        zebraRow(row, i);
        borderAll(row);
        row.getCell("totalAmount").numFmt = "#,##0";
        row.getCell("totalAmount").alignment = { horizontal: "right" };
        row.getCell("count").alignment = { horizontal: "center" };
      });
      regionSheet.views = [{ state: "frozen", ySplit: 1 }];

      // ── Sheet 4: Monthly Trends ─────────────────────────────
      const trendsSheet = wb.addWorksheet("📈 Monthly Trends");
      trendsSheet.columns = [
        { header: "#", key: "serial", width: 6 },
        { header: "Month", key: "month", width: 14 },
        { header: "Pending", key: "pending", width: 14 },
        { header: "Under Review", key: "underReview", width: 16 },
        { header: "Approved", key: "approved", width: 14 },
        { header: "Total", key: "total", width: 14 },
      ];
      styleHeader(trendsSheet, "FF2E7D5E");
      data.monthlyData.forEach((m, i) => {
        const row = trendsSheet.addRow({
          serial: i + 1,
          month: m.month,
          pending: m.Pending,
          underReview: m["Under Review"],
          approved: m.Approved,
          total: m.total,
        });
        zebraRow(row, i);
        borderAll(row);
        ["pending", "underReview", "approved", "total"].forEach((k) => {
          row.getCell(k).alignment = { horizontal: "center" };
        });
        // Color approved column green
        row.getCell("approved").font = {
          color: { argb: "FF2E7D5E" },
          bold: true,
        };
      });
      trendsSheet.views = [{ state: "frozen", ySplit: 1 }];

      // ── Sheet 5: Recent Applications ───────────────────────
      const recentSheet = wb.addWorksheet("📋 Recent Applications");
      recentSheet.columns = [
        { header: "#", key: "serial", width: 6 },
        { header: "Applicant Name", key: "name", width: 26 },
        { header: "Sector", key: "sector", width: 18 },
        { header: "Region", key: "region", width: 18 },
        { header: "Amount (LKR)", key: "amount", width: 18 },
        { header: "Status", key: "status", width: 14 },
        { header: "Applied Date", key: "appliedDate", width: 16 },
      ];
      styleHeader(recentSheet, "FF2E7D5E");
      data.recentApplications.forEach((l, i) => {
        const row = recentSheet.addRow({
          serial: i + 1,
          name: l.applicantName,
          sector: l.sector,
          region: l.region,
          amount: Number(l.amount),
          status: l.status,
          appliedDate: new Date(l.appliedDate).toLocaleDateString("en-LK"),
        });
        zebraRow(row, i);
        borderAll(row);
        row.getCell("amount").numFmt = "#,##0";
        row.getCell("amount").alignment = { horizontal: "right" };

        // Color status cell
        const statusCell = row.getCell("status");
        const statusColors = {
          Approved: "FF2E7D5E",
          Pending: "FF1A2535",
          Rejected: "FFDC2626",
        };
        if (statusColors[l.status]) {
          statusCell.font = { color: { argb: "FFFFFFFF" }, bold: true };
          statusCell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: statusColors[l.status] },
          };
          statusCell.alignment = { horizontal: "center" };
        }
      });
      recentSheet.views = [{ state: "frozen", ySplit: 1 }];

      // ── Sheet 6: Fund Allocation History ───────────────────
      const fundSheet = wb.addWorksheet("💰 Fund History");
      fundSheet.columns = [
        { header: "Fiscal Year", key: "year", width: 14 },
        { header: "Total Allocation", key: "allocation", width: 22 },
        { header: "Set By", key: "setBy", width: 20 },
        { header: "Date Set", key: "date", width: 18 },
        { header: "Note", key: "note", width: 30 },
        { header: "Status", key: "status", width: 12 },
      ];
      styleHeader(fundSheet, "FF2E7D5E");
      fundHistory.forEach((f, i) => {
        const row = fundSheet.addRow({
          year: `FY ${f.year}`,
          allocation: f.totalAllocation,
          setBy: f.setBy?.username || f.setBy?.email || "—",
          date: new Date(f.createdAt).toLocaleDateString("en-LK"),
          note: f.note || "—",
          status: f.year === new Date().getFullYear() ? "Current" : "Past",
        });
        zebraRow(row, i);
        borderAll(row);
        row.getCell("allocation").numFmt = "#,##0";
        row.getCell("allocation").alignment = { horizontal: "right" };
        row.getCell("allocation").font = {
          color: { argb: "FF2E7D5E" },
          bold: true,
        };
        if (f.year === new Date().getFullYear()) {
          row.getCell("status").font = {
            color: { argb: "FF2E7D5E" },
            bold: true,
          };
        }
      });
      fundSheet.views = [{ state: "frozen", ySplit: 1 }];

      // ── Download ────────────────────────────────────────────
      const buf = await wb.xlsx.writeBuffer();
      saveAs(
        new Blob([buf]),
        `IDB_Dashboard_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed. Please try again.");
    }
  };

  // ── Filtered sector data ──────────────────────────────────
  const filteredSectorData =
    data?.sectorStats?.filter((s) =>
      sectorFilter === "All" ? true : s._id === sectorFilter,
    ) || [];

  // ── Cross-filter: drill-down data ─────────────────────────
  const crossFilterData = useCallback(() => {
    if (!data)
      return {
        regional: data?.regionalStats || [],
        sector: data?.sectorStats || [],
        monthly: data?.monthlyData || [],
      };
    let regional = data.regionalStats;
    let sector = data.sectorStats;
    let monthly = data.monthlyData;
    // If a sector is selected, we highlight it in the sector chart
    // and filter regional/monthly (backend would need this — for now show all with highlight)
    return { regional, sector, monthly };
  }, [data, selectedSector, selectedRegion]);

  const {
    regional: regionalData,
    sector: sectorData,
    monthly: monthlyData,
  } = crossFilterData();

  const kpi = data?.kpi;
  const totalAllocation = currentFund?.totalAllocation || 0;
  const approvedAmount = kpi?.approvedAmount || 0;
  const balanceAmount = totalAllocation - approvedAmount;
  const utilizationPct =
    totalAllocation > 0
      ? Math.min(
          Math.round((approvedAmount / totalAllocation) * 1000) / 10,
          100,
        )
      : 0;

  if (error)
    return (
      <div className="p-8 text-center">
        <AlertTriangle size={40} className="text-red-400 mx-auto mb-3" />
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* ── Page Header ──────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 text-sm">
            Real-time overview of IDB Loan Fund performance.
          </p>
        </div>
        <button
          onClick={exportExcel}
          disabled={loading || !data}
          className="flex items-center gap-1.5 text-xs font-medium text-white bg-[#e09510] hover:bg-[#c8840e] px-3.5 py-2 rounded-lg transition-all shadow-sm disabled:opacity-50"
        >
          <Download size={16} /> Export Excel
        </button>
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 1 — KPI CARDS
      ══════════════════════════════════════════════════ */}

      {/* Row 1 — Application Counts */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            {/* Total Applications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Total Applications
                </span>
                <FileText size={18} className="text-[#e09510]" />
              </div>
              <p className="text-3xl font-bold text-gray-800">
                {kpi.totalApplications}
              </p>
              <p className="text-xs text-gray-400 mt-1">All time submissions</p>
            </div>

            {/* Pending — clickable with filter */}
            <div
              onClick={() => navigate("/applications?status=Pending")}
              className="bg-white rounded-xl shadow-sm border border-yellow-100 p-5 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-yellow-500 uppercase">
                  Pending
                </span>
                <Clock size={18} className="text-yellow-500" />
              </div>
              <p className="text-3xl font-bold text-yellow-600">
                {kpi.pending}
              </p>
              <p className="text-xs text-yellow-400 mt-1 group-hover:underline">
                Click to view filtered →
              </p>
            </div>

            {/* Approved — clickable with filter */}
            <div
              onClick={() => navigate("/applications?status=Approved")}
              className="bg-white rounded-xl shadow-sm border border-emerald-100 p-5 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all group"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-emerald-500 uppercase">
                  Approved
                </span>
                <CheckCircle size={18} className="text-emerald-500" />
              </div>
              <p className="text-3xl font-bold text-emerald-600">
                {kpi.approved}
              </p>
              <p className="text-xs text-emerald-400 mt-1 group-hover:underline">
                Click to view filtered →
              </p>
            </div>
          </>
        )}
      </div>

      {/* Row 2 — Financial KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          [...Array(3)].map((_, i) => <Skeleton key={i} className="h-28" />)
        ) : (
          <>
            {/* Total Fund Allocation — dynamic with + button */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Total Fund Allocation
                </span>
                <div className="flex items-center gap-2">
                  <Wallet size={18} className="text-[#e09510]" />
                  <button
                    onClick={() => setShowFundModal(true)}
                    className="p-1 rounded-full bg-[#e09510] hover:bg-[#c8840e] text-white transition-all"
                    title="Set fund allocation"
                  >
                    <Plus size={12} />
                  </button>
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {totalAllocation > 0 ? (
                  fmt(totalAllocation)
                ) : (
                  <span className="text-gray-400 text-base">
                    Not set - click +
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {currentFund?.year
                  ? `FY ${currentFund.year}`
                  : "Click + to set allocation"}
              </p>
            </div>

            {/* Approved Amount */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Total Approved
                </span>
                <TrendingUp size={18} className="text-emerald-500" />
              </div>
              <p className="text-2xl font-bold text-emerald-600">
                {fmt(approvedAmount)}
              </p>
              <p className="text-xs text-gray-400 mt-1">Disbursed so far</p>
            </div>

            {/* Balance */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Balance Remaining
                </span>
                <Wallet size={18} className="text-blue-500" />
              </div>
              <p className="text-2xl font-bold text-blue-600">
                {totalAllocation > 0 ? (
                  fmt(balanceAmount)
                ) : (
                  <span className="text-gray-400 text-base">—</span>
                )}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Available to disburse
              </p>
            </div>
          </>
        )}
      </div>

      {/* Progress Bar */}
      {!loading && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700">
              Fund Utilization
            </span>
            {totalAllocation > 0 ? (
              <span
                className={`text-sm font-bold ${utilizationPct >= 90 ? "text-red-500" : utilizationPct >= 70 ? "text-orange-500" : "text-emerald-500"}`}
              >
                {utilizationPct}% Used
              </span>
            ) : (
              <span className="text-xs text-gray-400">
                Set total allocation to track utilization
              </span>
            )}
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 rounded-full transition-all duration-700"
              style={{
                width: `${utilizationPct}%`,
                backgroundColor: getGaugeColor(utilizationPct),
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>LKR 0</span>
            <span>{totalAllocation > 0 ? fmt(totalAllocation) : "—"}</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          SECTION 2 — ANALYTICS & VISUALIZATIONS
      ══════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-1">
          Analytics & Visualizations
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          {selectedSector ? `Filtered by sector: ${selectedSector}` : ""}
          {selectedRegion ? ` · Region: ${selectedRegion}` : ""}
          {(selectedSector || selectedRegion) && (
            <button
              onClick={() => {
                setSelectedSector(null);
                setSelectedRegion(null);
              }}
              className="ml-2 text-[#e09510] underline"
            >
              Clear filters
            </button>
          )}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── A. Sector-Wise Donut Chart ──────────────── */}
          <ChartCard
            title="Sector-Wise Allocation"
            subtitle="Click a sector to cross-filter charts"
            chartRef={sectorRef}
            filename="sector_allocation"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() =>
                  setSectorMetric(
                    sectorMetric === "totalAmount" ? "count" : "totalAmount",
                  )
                }
                className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-[#e09510] hover:text-white hover:border-[#e09510] transition-all"
              >
                {sectorMetric === "totalAmount" ? "Show Count" : "Show Amount"}
              </button>
              <button
                onClick={() => setShowLegend(!showLegend)}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition-all"
              >
                {showLegend ? "Hide Legend" : "Show Legend"}
              </button>
              <button
                onClick={() =>
                  setSectorChartType(
                    sectorChartType === "donut" ? "pie" : "donut",
                  )
                }
                className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-[#e09510] hover:text-white hover:border-[#e09510] transition-all"
              >
                {sectorChartType === "donut" ? "Pie View" : "Donut View"}
              </button>
              <select
                value={sectorFilter}
                onChange={(e) => {
                  setSectorFilter(e.target.value);
                  setSelectedSector(
                    e.target.value === "All" ? null : e.target.value,
                  );
                }}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 bg-white outline-none"
              >
                <option value="All">All Sectors</option>
                {data?.sectorStats?.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s._id}
                  </option>
                ))}
              </select>
            </div>
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <div ref={sectorRef}>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={filteredSectorData}
                      dataKey={sectorMetric}
                      nameKey="_id"
                      cx="50%"
                      cy="50%"
                      innerRadius={sectorChartType === "donut" ? 60 : 0}
                      outerRadius={100}
                      paddingAngle={3}
                      onClick={(d) =>
                        setSelectedSector(
                          selectedSector === d._id ? null : d._id,
                        )
                      }
                    >
                      {filteredSectorData.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                          opacity={
                            selectedSector && selectedSector !== entry._id
                              ? 0.3
                              : 1
                          }
                          cursor="pointer"
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) =>
                        sectorMetric === "totalAmount" ? fmt(v) : `${v} loans`
                      }
                    />
                    {showLegend && <Legend />}
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          {/* ── B. Regional Bar Chart ───────────────────── */}
          <ChartCard
            title="Regional Comparison"
            subtitle="Approved loan amounts by region"
            chartRef={regionalRef}
            filename="regional_comparison"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() =>
                  setBarOrientation(
                    barOrientation === "vertical" ? "horizontal" : "vertical",
                  )
                }
                className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-[#e09510] hover:text-white hover:border-[#e09510] transition-all"
              >
                {barOrientation === "vertical" ? "Horizontal" : "Vertical"}
              </button>
              <button
                onClick={() => setShowGrid(!showGrid)}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition-all"
              >
                {showGrid ? "Hide Grid" : "Show Grid"}
              </button>
            </div>
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <div ref={regionalRef}>
                <ResponsiveContainer width="100%" height={260}>
                  {barOrientation === "vertical" ? (
                    <BarChart
                      key={`v-${showGrid}`}
                      data={regionalData}
                      margin={{ bottom: 20 }}
                    >
                      {showGrid && (
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      )}
                      <XAxis
                        dataKey="_id"
                        tick={{ fontSize: 11 }}
                        angle={-25}
                        textAnchor="end"
                      />
                      <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} />
                      <Tooltip formatter={(v) => fmt(v)} />
                      <Bar
                        dataKey="totalAmount"
                        radius={[4, 4, 0, 0]}
                        name="Amount"
                        onClick={(d) =>
                          setSelectedRegion(
                            selectedRegion === d._id ? null : d._id,
                          )
                        }
                        cursor="pointer"
                      >
                        {regionalData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={COLORS[i % COLORS.length]}
                            opacity={
                              selectedRegion && selectedRegion !== entry._id
                                ? 0.3
                                : 1
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  ) : (
                    <BarChart
                      key={`h-${showGrid}`}
                      data={regionalData}
                      layout="vertical"
                      margin={{ left: 10 }}
                    >
                      {showGrid && (
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      )}
                      <XAxis
                        type="number"
                        tickFormatter={fmtShort}
                        tick={{ fontSize: 11 }}
                      />
                      <YAxis
                        type="category"
                        dataKey="_id"
                        tick={{ fontSize: 11 }}
                        width={90}
                      />
                      <Tooltip formatter={(v) => fmt(v)} />
                      <Bar
                        dataKey="totalAmount"
                        radius={[0, 4, 4, 0]}
                        name="Amount"
                        onClick={(d) =>
                          setSelectedRegion(
                            selectedRegion === d._id ? null : d._id,
                          )
                        }
                        cursor="pointer"
                      >
                        {regionalData.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={COLORS[i % COLORS.length]}
                            opacity={
                              selectedRegion && selectedRegion !== entry._id
                                ? 0.3
                                : 1
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          {/* ── C. Monthly Trends ───────────────────────── */}
          <ChartCard
            title="Application Volume & Trends"
            subtitle="Monthly application breakdown"
            chartRef={trendsRef}
            filename="monthly_trends"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setShowStacked(!showStacked)}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-[#e09510] hover:text-white hover:border-[#e09510] transition-all"
              >
                {showStacked ? "Unstacked" : "Stacked"}
              </button>
              <button
                onClick={() => setShowTrend(!showTrend)}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition-all"
              >
                {showTrend ? "Hide Trend" : "Show Trend"}
              </button>
            </div>
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <div ref={trendsRef}>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={monthlyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="#e5e7eb"
                      strokeOpacity={showGrid ? 1 : 0}
                    />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="Pending"
                      stackId={showStacked ? "a" : undefined}
                      fill="#f59e0b"
                      name="Pending"
                    />
                    <Bar
                      dataKey="Under Review"
                      stackId={showStacked ? "a" : undefined}
                      fill="#3b82f6"
                      name="Under Review"
                    />
                    <Bar
                      dataKey="Approved"
                      stackId={showStacked ? "a" : undefined}
                      fill="#10b981"
                      name="Approved"
                      radius={showStacked ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                    />
                    {showTrend && (
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#1a2535"
                        strokeWidth={2}
                        dot={false}
                        name="Total Trend"
                      />
                    )}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            )}
          </ChartCard>

          {/* ── D. Area Chart (Monthly Amounts) ─────────── */}
          <ChartCard
            title="Monthly Approved Amounts"
            subtitle="Approved amounts (area) vs total applications (line)"
            chartRef={trendsRef}
            filename="monthly_amounts"
          >
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <ComposedChart data={data?.monthlyData}>
                  {showGrid && (
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  )}
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis
                    yAxisId="amount"
                    orientation="left"
                    tickFormatter={fmtShort}
                    tick={{ fontSize: 10 }}
                  />
                  <YAxis
                    yAxisId="count"
                    orientation="right"
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip
                    formatter={(v, name) =>
                      name === "Approved Amount (LKR)"
                        ? fmt(v)
                        : `${v} applications`
                    }
                  />
                  <Legend />
                  <Area
                    yAxisId="amount"
                    type="monotone"
                    dataKey="approvedAmount"
                    stroke="#10b981"
                    fill="#d1fae5"
                    strokeWidth={2}
                    name="Approved Amount (LKR)"
                  />
                  <Line
                    yAxisId="count"
                    type="monotone"
                    dataKey="total"
                    stroke="#e09510"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Total Applications"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </ChartCard>

          {/* ── E. Financial Sustainability Gauge ──────── */}
          <ChartCard
            title="Financial Sustainability"
            subtitle="Real-time fund depletion monitor"
            chartRef={gaugeRef}
            filename="fund_sustainability"
          >
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <div
                ref={gaugeRef}
                className="flex flex-col items-center justify-center h-56"
              >
                {totalAllocation === 0 ? (
                  <div className="text-center">
                    <AlertTriangle
                      size={36}
                      className="text-gray-300 mx-auto mb-3"
                    />
                    <p className="text-gray-400 text-sm">
                      Set total allocation to view gauge
                    </p>
                    <button
                      onClick={() => setShowFundModal(true)}
                      className="mt-3 text-xs px-4 py-2 rounded-lg bg-[#e09510] text-white hover:bg-[#c8840e] transition-all"
                    >
                      Set Allocation
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Custom SVG Gauge */}
                    <svg viewBox="0 0 200 120" className="w-48">
                      <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke="#f0f4f8"
                        strokeWidth="16"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 20 100 A 80 80 0 0 1 180 100"
                        fill="none"
                        stroke={getGaugeColor(utilizationPct)}
                        strokeWidth="16"
                        strokeLinecap="round"
                        strokeDasharray={`${(utilizationPct / 100) * 251.2} 251.2`}
                        style={{ transition: "stroke-dasharray 0.8s ease" }}
                      />
                      <text
                        x="100"
                        y="90"
                        textAnchor="middle"
                        fontSize="22"
                        fontWeight="bold"
                        fill={getGaugeColor(utilizationPct)}
                      >
                        {utilizationPct}%
                      </text>
                      <text
                        x="100"
                        y="108"
                        textAnchor="middle"
                        fontSize="9"
                        fill="#9ca3af"
                      >
                        Utilization
                      </text>
                    </svg>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      {utilizationPct >= 90
                        ? "🔴 Critical — Fund nearly exhausted!"
                        : utilizationPct >= 70
                          ? "🟠 Warning — Monitor closely"
                          : "🟢 Safe - Fund utilization normal"}
                    </p>
                    <div className="flex gap-6 mt-3 text-xs text-gray-500">
                      <span>
                        Used:{" "}
                        <strong className="text-gray-700">
                          {fmtShort(approvedAmount)}
                        </strong>
                      </span>
                      <span>
                        Left:{" "}
                        <strong className="text-gray-700">
                          {fmtShort(balanceAmount)}
                        </strong>
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </ChartCard>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 3 — RECENT ACTIVITIES
      ══════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Activity size={18} className="text-[#e09510]" />
          <h2 className="text-lg font-bold text-gray-700">Recent Activities</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Recent Applications */}
          <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <FileText size={15} className="text-[#e09510]" /> Recent
              Applications
            </h3>
            {loading ? (
              <Skeleton className="h-48" />
            ) : (
              <ul className="space-y-3">
                {data.recentApplications.slice(0, 8).map((loan) => (
                  <li
                    key={loan._id}
                    className="flex items-center justify-between text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-700 truncate">
                        {loan.applicantName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {loan.sector} · {loan.region}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 ${STATUS_COLORS[loan.status]}`}
                    >
                      {loan.status}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Approvals */}
          <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <CheckCircle size={15} className="text-emerald-500" /> Recent
              Approvals
            </h3>
            {loading ? (
              <Skeleton className="h-48" />
            ) : (
              <ul className="space-y-3">
                {data.recentApprovals.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">
                    No approvals yet
                  </p>
                ) : (
                  data.recentApprovals.map((loan) => (
                    <li
                      key={loan._id}
                      className="text-sm border-b border-gray-50 pb-2 last:border-0"
                    >
                      <p className="font-medium text-gray-700">
                        {loan.applicantName}
                      </p>
                      <div className="flex justify-between mt-0.5">
                        <span className="text-xs text-gray-400">
                          {loan.sector}
                        </span>
                        <span className="text-xs font-semibold text-emerald-600">
                          {fmt(loan.amount)}
                        </span>
                      </div>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          SECTION 4 — FUND ALLOCATION HISTORY
      ══════════════════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-[#e09510]" />
            <h2 className="text-lg font-bold text-gray-700">
              Fund Allocation History
            </h2>
          </div>
          <button
            onClick={() => setShowFundModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e09510] hover:bg-[#c8840e] text-white text-sm font-semibold transition-all shadow-sm"
          >
            <Plus size={15} /> Set Allocation
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-6 space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                    Fiscal Year
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                    Total Allocation
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                    Set By
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                    Date Set
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                    Note
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {fundHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-400 text-sm"
                    >
                      No fund allocations set yet. Click "Set Allocation" to add
                      one.
                    </td>
                  </tr>
                ) : (
                  fundHistory.map((record) => (
                    <tr
                      key={record._id}
                      className="border-b border-gray-50 hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4 font-bold text-gray-800">
                        FY {record.year}
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">
                        {fmt(record.totalAllocation)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {record.setBy?.username || record.setBy?.email || "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(record.createdAt).toLocaleDateString(
                          "en-LK",
                          {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          },
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                        {record.note || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            record.year === new Date().getFullYear()
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {record.year === new Date().getFullYear()
                            ? "Current"
                            : "Past"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          FUND SETTINGS MODAL
      ══════════════════════════════════════════════════ */}
      {showFundModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Set Fund Allocation
                </h3>
                <p className="text-xs text-gray-400">
                  Define the total IDB loan fund for a fiscal year
                </p>
              </div>
              <button
                onClick={() => setShowFundModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Fiscal Year
                </label>
                <input
                  type="number"
                  value={fundInput.year}
                  onChange={(e) =>
                    setFundInput({ ...fundInput, year: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Total Allocation (LKR)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 50000000"
                  value={fundInput.amount}
                  onChange={(e) =>
                    setFundInput({ ...fundInput, amount: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
                {fundInput.amount > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {fmt(Number(fundInput.amount))}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Approved by IDB Board"
                  value={fundInput.note}
                  onChange={(e) =>
                    setFundInput({ ...fundInput, note: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>

              {fundError && <p className="text-sm text-red-500">{fundError}</p>}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowFundModal(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveFund}
                disabled={fundLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#e09510] hover:bg-[#c8840e] text-white text-sm font-semibold transition-all disabled:opacity-60"
              >
                {fundLoading ? "Saving..." : "Save Allocation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
