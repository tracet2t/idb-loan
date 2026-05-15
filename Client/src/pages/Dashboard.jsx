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
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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
    date: new Date(),
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

  // Fund history filters
  const [fundSortBy, setFundSortBy] = useState("createdAt");
  const [fundOrder, setFundOrder] = useState("desc");
  const [fundChartData, setFundChartData] = useState([]);

  // Edit/Delete modal
  const [editRecord, setEditRecord] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Sector vs Region view
  const [sectorRegionView, setSectorRegionView] = useState("bar"); // 'bar' or 'heatmap'
  const sectorRegionRef = useRef(null);

  // Merged chart toggles
  const [showArea, setShowArea] = useState(true);
  const [showBars, setShowBars] = useState(true);
  const [showLine, setShowLine] = useState(true);

  // Chart refs for download
  const sectorRef = useRef(null);
  const regionalRef = useRef(null);
  const trendsRef = useRef(null);
  const gaugeRef = useRef(null);

  // ── Fetch dashboard data ──────────────────────────────────
  const fetchStats = useCallback(
    async (sector = null, region = null) => {
      try {
        setLoading(true);
        const params = {};
        if (sector) params.sector = sector;
        if (region) params.region = region;

        const [statsRes, fundRes, historyRes, chartRes] = await Promise.all([
          api.get("/stats", { params }),
          api.get("/fund-settings"),
          api.get("/fund-settings/history", {
            params: { sortBy: fundSortBy, order: fundOrder },
          }),
          api.get("/fund-settings/chart-data"),
        ]);
        setData(statsRes.data);
        setCurrentFund(fundRes.data);
        setFundHistory(historyRes.data);
        setFundChartData(chartRes.data);
        setFundInput((prev) => ({ ...prev, amount: "" }));
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    },
    [fundSortBy, fundOrder],
  );

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (selectedSector || selectedRegion) {
      fetchStats(selectedSector, selectedRegion);
    } else {
      fetchStats();
    }
  }, [selectedSector, selectedRegion]);

  // Auto-apply fund history filters
  useEffect(() => {
    fetchStats(selectedSector, selectedRegion);
  }, [fundSortBy, fundOrder]);

  // ── Save fund allocation ──────────────────────────────────
  const handleSaveFund = async () => {
    setFundError("");
    if (!fundInput.amount || Number(fundInput.amount) <= 0) {
      setFundError("Please enter a valid amount.");
      return;
    }
    if (!fundInput.date) {
      setFundError("Please select a date.");
      return;
    }

    const selectedDate = new Date(fundInput.date);
    console.log("Saving with date:", selectedDate);

    try {
      setFundLoading(true);
      const res = await api.post("/fund-settings", {
        totalAllocation: Number(fundInput.amount),
        year: selectedDate.getFullYear(),
        month: selectedDate.getMonth() + 1,
        day: selectedDate.getDate(),
        date: selectedDate.toISOString(),
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

  // ── Edit fund record ──────────────────────────────────
  const handleEditFund = async () => {
    setFundError("");
    if (
      !editRecord.totalAllocation ||
      Number(editRecord.totalAllocation) <= 0
    ) {
      setFundError("Please enter a valid amount.");
      return;
    }
    try {
      setFundLoading(true);
      await api.patch(`/fund-settings/${editRecord._id}`, {
        totalAllocation: Number(editRecord.totalAllocation),
        month: Number(editRecord.month),
        year: Number(editRecord.year),
        note: editRecord.note,
      });
      setShowEditModal(false);
      setEditRecord(null);
      fetchStats();
    } catch (err) {
      setFundError(err.response?.data?.message || "Failed to update.");
    } finally {
      setFundLoading(false);
    }
  };

  // ── Delete fund record ────────────────────────────────
  const handleDeleteFund = async () => {
    try {
      setDeleteLoading(true);
      await api.delete(`/fund-settings/${deleteTarget._id}`);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
      fetchStats();
    } catch (err) {
      console.error("Delete error:", err);
    } finally {
      setDeleteLoading(false);
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
      const html2canvas = (await import("html2canvas")).default;

      // ── Capture chart as base64 ──────────────────────────
      const captureChart = async (ref) => {
        if (!ref?.current) return null;
        try {
          const canvas = await html2canvas(ref.current, {
            backgroundColor: "#ffffff",
            scale: 1.5,
            useCORS: true,
          });
          return canvas.toDataURL("image/png").split(",")[1];
        } catch (e) {
          console.error("Chart capture error:", e);
          return null;
        }
      };

      // Capture all charts
      const [sectorImg, sectorRegionImg, trendsImg, gaugeImg] =
        await Promise.all([
          captureChart(sectorRef),
          captureChart(sectorRegionRef),
          captureChart(trendsRef),
        ]);

      const wb = new ExcelJS.Workbook();
      wb.creator = "IDB Loan Portal";
      wb.created = new Date();

      // ── Helper: style header row ─────────────────────────
      const styleHeader = (sheet) => {
        sheet.getRow(1).eachCell((cell) => {
          cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FF2E7D5E" },
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

      // Helper: embed image into sheet
      const embedImage = async (sheet, imgBase64, row, col, width, height) => {
        if (!imgBase64) return;
        const imgId = wb.addImage({ base64: imgBase64, extension: "png" });
        sheet.addImage(imgId, {
          tl: { col: col - 1, row: row - 1 },
          ext: { width, height },
        });
      };

      // ── Sheet 1: KPI Summary ─────────────────────────────
      const kpiSheet = wb.addWorksheet("📊 KPI Summary");
      kpiSheet.columns = [
        { header: "Metric", key: "metric", width: 30 },
        { header: "Value", key: "value", width: 25 },
      ];
      styleHeader(kpiSheet);
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
        if (r.metric.includes("LKR")) {
          row.getCell("value").numFmt = "#,##0";
          row.getCell("value").alignment = { horizontal: "right" };
        }
      });
      kpiSheet.views = [{ state: "frozen", ySplit: 1 }];

      // ── Sheet 2: Sector Stats + Chart ────────────────────
      const sectorSheet = wb.addWorksheet("🏭 Sector Stats");
      sectorSheet.columns = [
        { header: "#", key: "serial", width: 6 },
        { header: "Sector", key: "sector", width: 25 },
        { header: "Total Amount (LKR)", key: "totalAmount", width: 22 },
        { header: "Number of Loans", key: "count", width: 18 },
      ];
      styleHeader(sectorSheet);
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
      // Embed sector chart beside data (column F onwards)
      await embedImage(sectorSheet, sectorImg, 1, 6, 480, 280);

      // ── Sheet 3: Regional Stats + Chart ──────────────────
      const regionSheet = wb.addWorksheet("🗺️ Regional Stats");
      regionSheet.columns = [
        { header: "#", key: "serial", width: 6 },
        { header: "Region", key: "region", width: 22 },
        { header: "Total Amount (LKR)", key: "totalAmount", width: 22 },
        { header: "Number of Loans", key: "count", width: 18 },
      ];
      styleHeader(regionSheet);
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
      await embedImage(regionSheet, sectorRegionImg, 1, 6, 480, 280);

      // ── Sheet 4: Monthly Trends + Chart ──────────────────
      const trendsSheet = wb.addWorksheet("📈 Monthly Trends");
      trendsSheet.columns = [
        { header: "#", key: "serial", width: 6 },
        { header: "Month", key: "month", width: 14 },
        { header: "Pending", key: "pending", width: 14 },
        { header: "Under Review", key: "underReview", width: 16 },
        { header: "Approved", key: "approved", width: 14 },
        { header: "Total", key: "total", width: 14 },
      ];
      styleHeader(trendsSheet);
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
        row.getCell("approved").font = {
          color: { argb: "FF2E7D5E" },
          bold: true,
        };
      });
      trendsSheet.views = [{ state: "frozen", ySplit: 1 }];
      await embedImage(trendsSheet, trendsImg, 1, 8, 480, 280);

      // ── Sheet 5: Recent Applications ─────────────────────
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
      styleHeader(recentSheet);
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

      // ── Sheet 6: Fund History ─────────────────────────────
      const fundSheet = wb.addWorksheet("💰 Fund History");
      fundSheet.columns = [
        { header: "Month / Year", key: "period", width: 16 },
        { header: "Total Allocation", key: "allocation", width: 22 },
        { header: "Set By", key: "setBy", width: 20 },
        { header: "Date Added", key: "date", width: 18 },
        { header: "Note", key: "note", width: 30 },
      ];
      styleHeader(fundSheet);
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      fundHistory.forEach((f, i) => {
        const row = fundSheet.addRow({
          period: `${monthNames[f.month - 1]} ${f.year}`,
          allocation: f.totalAllocation,
          setBy: f.setBy?.username || f.setBy?.email || "—",
          date: new Date(f.allocationDate || f.createdAt).toLocaleDateString(
            "en-LK",
          ),
          note: f.note || "—",
        });
        zebraRow(row, i);
        borderAll(row);
        row.getCell("allocation").numFmt = "#,##0";
        row.getCell("allocation").alignment = { horizontal: "right" };
        row.getCell("allocation").font = {
          color: { argb: "FF2E7D5E" },
          bold: true,
        };
      });
      fundSheet.views = [{ state: "frozen", ySplit: 1 }];

      // ── Sheet 7: Dashboard Charts ─────────────────────────
      const chartsSheet = wb.addWorksheet("📊 Dashboard Charts");
      chartsSheet.getColumn(1).width = 80;

      // Title
      chartsSheet.mergeCells("A1:H1");
      const titleCell = chartsSheet.getCell("A1");
      titleCell.value = "IDB Loan Fund — Dashboard Charts";
      titleCell.font = { bold: true, size: 16, color: { argb: "FF1A2535" } };
      titleCell.alignment = { horizontal: "center", vertical: "middle" };
      titleCell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFFF3CD" },
      };
      chartsSheet.getRow(1).height = 36;

      chartsSheet.getCell("A2").value =
        `Generated: ${new Date().toLocaleDateString("en-LK")}`;
      chartsSheet.getCell("A2").font = {
        size: 10,
        color: { argb: "FF6B7280" },
      };
      chartsSheet.getRow(2).height = 20;

      // Chart labels and images
      const chartEntries = [
        { label: "Sector-Wise Allocation", img: sectorImg, row: 4, col: 1 },
        {
          label: "Sector vs Region Distribution",
          img: sectorRegionImg,
          row: 4,
          col: 10,
        },
        {
          label: "Application Volume & Trends",
          img: trendsImg,
          row: 24,
          col: 1,
        },
      ];

      for (const entry of chartEntries) {
        // Label
        const labelCell = chartsSheet.getCell(entry.row, entry.col);
        labelCell.value = entry.label;
        labelCell.font = { bold: true, size: 12, color: { argb: "FF1A2535" } };
        chartsSheet.getRow(entry.row).height = 20;

        // Image
        if (entry.img) {
          const imgId = wb.addImage({ base64: entry.img, extension: "png" });
          chartsSheet.addImage(imgId, {
            tl: { col: entry.col - 1, row: entry.row },
            ext: { width: 460, height: 260 },
          });
        }
      }

      // ── Download ──────────────────────────────────────────
      const buf = await wb.xlsx.writeBuffer();
      saveAs(
        new Blob([buf]),
        `IDB_Dashboard_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
    } catch (err) {
      console.error("Export error:", err);
      alert("Export failed: " + err.message);
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
                    onClick={() => {
                      setFundInput({ amount: "", date: new Date(), note: "" });
                      setFundError("");
                      setShowFundModal(true);
                    }}
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
          {/* ── A. Sector-Wise Donut/Pie Chart ──────────── */}
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
                      cursor="pointer"
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

          {/* ── B. Sector vs Region Chart ───────────────── */}
          {/* ── B. Sector vs Region Chart ───────────────── */}
          <ChartCard
            title="Sector vs Region Distribution"
            subtitle="Which sector dominates in which region"
            chartRef={sectorRegionRef}
            filename="sector_region"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() =>
                  setSectorRegionView(
                    sectorRegionView === "bar" ? "heatmap" : "bar",
                  )
                }
                className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-[#e09510] hover:text-white hover:border-[#e09510] transition-all"
              >
                {sectorRegionView === "bar" ? "Heatmap View" : "Bar View"}
              </button>
            </div>
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              (() => {
                // Reshape crossData into { region, Sector1: amount, Sector2: amount, ... }
                const regions = [
                  ...new Set(data?.crossData?.map((d) => d.region) || []),
                ];
                const sectors = [
                  ...new Set(data?.crossData?.map((d) => d.sector) || []),
                ];
                const barData = regions.map((region) => {
                  const entry = { region };
                  let total = 0;
                  sectors.forEach((sector) => {
                    const found = data?.crossData?.find(
                      (d) => d.region === region && d.sector === sector,
                    );
                    entry[sector] = found?.totalAmount || 0;
                    total += entry[sector];
                  });
                  entry.total = total;
                  return entry;
                });

                return (
                  <div ref={sectorRegionRef}>
                    {sectorRegionView === "bar" ? (
                      barData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
                          No approved loan data available
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <ComposedChart data={barData} margin={{ bottom: 20 }}>
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#f0f0f0"
                            />
                            <XAxis
                              dataKey="region"
                              tick={{ fontSize: 10 }}
                              angle={-25}
                              textAnchor="end"
                            />
                            <YAxis
                              tickFormatter={fmtShort}
                              tick={{ fontSize: 11 }}
                            />
                            <Tooltip
                              formatter={(v, name) => [fmt(v), name]}
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                  <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-xs max-w-48">
                                    <p className="font-bold text-gray-700 mb-2">
                                      {label}
                                    </p>
                                    {payload
                                      .filter((p) => p.value > 0)
                                      .map((p, i) => (
                                        <p
                                          key={i}
                                          style={{ color: p.fill }}
                                          className="py-0.5"
                                        >
                                          {p.name}: {fmt(p.value)}
                                        </p>
                                      ))}
                                  </div>
                                );
                              }}
                            />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            {sectors.map((sector, i) => (
                              <Bar
                                key={sector}
                                dataKey={sector}
                                fill={COLORS[i % COLORS.length]}
                                stackId="a"
                                radius={
                                  i === sectors.length - 1
                                    ? [4, 4, 0, 0]
                                    : [0, 0, 0, 0]
                                }
                              />
                            ))}
                            <Line
                              type="monotone"
                              dataKey="total"
                              stroke="#1a2535"
                              strokeWidth={2}
                              dot={{ r: 4, fill: "#1a2535" }}
                              name="Total"
                            />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )
                    ) : (
                      // Heatmap view
                      <div className="overflow-auto max-h-64">
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr>
                              <th className="p-2 text-left text-gray-500 font-bold border border-gray-100 bg-gray-50 sticky left-0">
                                Sector \ Region
                              </th>
                              {regions.map((r) => (
                                <th
                                  key={r}
                                  className="p-2 text-center text-gray-500 font-bold border border-gray-100 bg-gray-50 whitespace-nowrap"
                                >
                                  {r}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {sectors.map((sector) => {
                              const rowVals = regions.map((r) => {
                                const found = data?.crossData?.find(
                                  (d) => d.sector === sector && d.region === r,
                                );
                                return found?.totalAmount || 0;
                              });
                              const maxVal = Math.max(...rowVals, 1);
                              return (
                                <tr key={sector}>
                                  <td className="p-2 font-medium text-gray-700 border border-gray-100 bg-gray-50 sticky left-0 whitespace-nowrap">
                                    {sector}
                                  </td>
                                  {regions.map((r, ri) => {
                                    const val = rowVals[ri];
                                    const intensity = val / maxVal;
                                    const bg =
                                      intensity > 0.7
                                        ? "#065f46"
                                        : intensity > 0.4
                                          ? "#059669"
                                          : intensity > 0.1
                                            ? "#6ee7b7"
                                            : "#f0fdf4";
                                    const color =
                                      intensity > 0.4 ? "#ffffff" : "#374151";
                                    return (
                                      <td
                                        key={r}
                                        className="p-2 text-center border border-gray-100 font-medium transition-colors"
                                        style={{ backgroundColor: bg, color }}
                                      >
                                        {val > 0 ? fmtShort(val) : "—"}
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </ChartCard>

          {/* ── C. Merged: Volume + Amounts Trends ──────── */}
          <ChartCard
            title="Application Volume & Approved Amounts"
            subtitle="Monthly trends - bars show counts, area shows approved LKR"
            chartRef={trendsRef}
            filename="monthly_trends"
          >
            <div className="flex flex-wrap gap-2 mb-3">
              <button
                onClick={() => setShowBars(!showBars)}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-[#e09510] hover:text-white hover:border-[#e09510] transition-all"
              >
                {showBars ? "Hide Bars" : "Show Bars"}
              </button>
              <button
                onClick={() => setShowArea(!showArea)}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition-all"
              >
                {showArea ? "Hide Area" : "Show Area"}
              </button>
              <button
                onClick={() => setShowLine(!showLine)}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition-all"
              >
                {showLine ? "Hide Trend" : "Show Trend"}
              </button>
              <button
                onClick={() => setShowStacked(!showStacked)}
                className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition-all"
              >
                {showStacked ? "Unstacked" : "Stacked"}
              </button>
            </div>
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <div ref={trendsRef}>
                <ResponsiveContainer width="100%" height={260}>
                  <ComposedChart data={monthlyData}>
                    {showGrid && (
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    )}
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis
                      yAxisId="count"
                      orientation="left"
                      tick={{ fontSize: 10 }}
                    />
                    <YAxis
                      yAxisId="amount"
                      orientation="right"
                      tickFormatter={fmtShort}
                      tick={{ fontSize: 10 }}
                    />
                    <Tooltip
                      formatter={(v, name) =>
                        name === "Approved (LKR)" ? fmt(v) : `${v} applications`
                      }
                    />
                    <Legend />
                    {showBars && (
                      <>
                        <Bar
                          yAxisId="count"
                          dataKey="Pending"
                          stackId={showStacked ? "a" : undefined}
                          fill="#f59e0b"
                          name="Pending"
                        />
                        <Bar
                          yAxisId="count"
                          dataKey="Under Review"
                          stackId={showStacked ? "a" : undefined}
                          fill="#3b82f6"
                          name="Under Review"
                        />
                        <Bar
                          yAxisId="count"
                          dataKey="Approved"
                          stackId={showStacked ? "a" : undefined}
                          fill="#10b981"
                          name="Approved"
                          radius={showStacked ? [4, 4, 0, 0] : [4, 4, 0, 0]}
                        />
                      </>
                    )}
                    {showArea && (
                      <Area
                        yAxisId="amount"
                        type="monotone"
                        dataKey="approvedAmount"
                        stroke="#e09510"
                        fill="#fef3c7"
                        strokeWidth={2}
                        name="Approved (LKR)"
                      />
                    )}
                    {showLine && (
                      <Line
                        yAxisId="count"
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

          {/* ── D. Financial Sustainability Gauge ──────── */}
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
                        ? "🔴 Critical - Fund nearly exhausted!"
                        : utilizationPct >= 70
                          ? "🟠 Warning — Monitor closely"
                          : "🟢 Safe — Fund utilization normal"}
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
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-[#e09510]" />
            <h2 className="text-lg font-bold text-gray-700">
              Fund Allocation History
            </h2>
          </div>
          <button
            onClick={() => {
              setFundInput({ amount: "", date: new Date(), note: "" });
              setFundError("");
              setShowFundModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#e09510] hover:bg-[#c8840e] text-white text-sm font-semibold transition-all shadow-sm"
          >
            <Plus size={15} /> New Allocation
          </button>
        </div>

        {/* Fund Allocation vs Distribution Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-4">
          <h3 className="text-sm font-bold text-gray-700 mb-1">
            Monthly Fund Allocation vs Distribution
          </h3>
          <p className="text-xs text-gray-400 mb-4">
            How much was allocated vs how much was distributed each month
          </p>
          {loading ? (
            <Skeleton className="h-56" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={fundChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={fmtShort} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => fmt(v)} />
                <Legend />
                <Bar
                  dataKey="allocated"
                  fill="#e09510"
                  radius={[4, 4, 0, 0]}
                  name="Allocated (LKR)"
                />
                <Bar
                  dataKey="distributed"
                  fill="#10b981"
                  radius={[4, 4, 0, 0]}
                  name="Distributed (LKR)"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-3">
          <select
            value={fundSortBy}
            onChange={(e) => setFundSortBy(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="createdAt">Sort by Date</option>
            <option value="totalAllocation">Sort by Amount</option>
            <option value="year">Sort by Year</option>
            <option value="month">Sort by Month</option>
          </select>
          <select
            value={fundOrder}
            onChange={(e) => setFundOrder(e.target.value)}
            className="text-xs px-3 py-2 rounded-lg border border-gray-200 bg-white outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="desc">Descending</option>
            <option value="asc">Ascending</option>
          </select>
        </div>

        {/* History Table */}
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
                    Month / Year
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                    Total Allocation
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                    Set By
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                    Date Added
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                    Note
                  </th>
                  <th className="text-left px-6 py-3 text-xs font-bold text-gray-500 uppercase">
                    Actions
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
                      No fund allocations yet. Click "New Allocation" to add
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
                        {
                          [
                            "Jan",
                            "Feb",
                            "Mar",
                            "Apr",
                            "May",
                            "Jun",
                            "Jul",
                            "Aug",
                            "Sep",
                            "Oct",
                            "Nov",
                            "Dec",
                          ][record.month - 1]
                        }{" "}
                        {record.year}
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">
                        {fmt(record.totalAllocation)}
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        {record.setBy?.username || record.setBy?.email || "—"}
                      </td>
                      <td className="px-6 py-4 text-gray-500">
                        {new Date(
                          record.allocationDate || record.createdAt,
                        ).toLocaleDateString("en-LK", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                        {record.note || (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Edit */}
                          <button
                            onClick={() => {
                              setEditRecord({ ...record });
                              setFundError("");
                              setShowEditModal(true);
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 transition-all font-medium"
                          >
                            Edit
                          </button>
                          {/* Delete */}
                          <button
                            onClick={() => {
                              setDeleteTarget(record);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-all font-medium"
                          >
                            Delete
                          </button>
                        </div>
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
                  Allocation Date
                </label>
                <DatePicker
                  selected={fundInput.date}
                  onChange={(date) => {
                    console.log("Date selected:", date);
                    setFundInput((prev) => ({ ...prev, date }));
                  }}
                  dateFormat="dd MMMM yyyy"
                  showMonthDropdown
                  showYearDropdown
                  dropdownMode="select"
                  isClearable
                  placeholderText="Click to select date"
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm cursor-pointer"
                  wrapperClassName="w-full"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Total Allocation (LKR)
                </label>
                <input
                  type="number"
                  placeholder="e.g. 5000000"
                  value={fundInput.amount}
                  onChange={(e) =>
                    setFundInput((prev) => ({
                      ...prev,
                      amount: e.target.value,
                    }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveFund();
                  }}
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  autoFocus
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
      {/* ══ EDIT FUND MODAL ══════════════════════════════ */}
      {showEditModal && editRecord && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-lg font-bold text-gray-800">
                  Edit Allocation
                </h3>
                <p className="text-xs text-gray-400">
                  Update this fund allocation record
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditRecord(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Year
                  </label>
                  <input
                    type="number"
                    value={editRecord.year}
                    onChange={(e) =>
                      setEditRecord({ ...editRecord, year: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                    Month
                  </label>
                  <select
                    value={editRecord.month}
                    onChange={(e) =>
                      setEditRecord({ ...editRecord, month: e.target.value })
                    }
                    className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
                  >
                    {[
                      "January",
                      "February",
                      "March",
                      "April",
                      "May",
                      "June",
                      "July",
                      "August",
                      "September",
                      "October",
                      "November",
                      "December",
                    ].map((m, i) => (
                      <option key={i} value={i + 1}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Total Allocation (LKR)
                </label>
                <input
                  type="number"
                  value={editRecord.totalAllocation}
                  onChange={(e) =>
                    setEditRecord({
                      ...editRecord,
                      totalAllocation: e.target.value,
                    })
                  }
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
                {editRecord.totalAllocation > 0 && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {fmt(Number(editRecord.totalAllocation))}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">
                  Note (Optional)
                </label>
                <input
                  type="text"
                  value={editRecord.note || ""}
                  onChange={(e) =>
                    setEditRecord({ ...editRecord, note: e.target.value })
                  }
                  className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                />
              </div>
              {fundError && <p className="text-sm text-red-500">{fundError}</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditRecord(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleEditFund}
                disabled={fundLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-[#e09510] hover:bg-[#c8840e] text-white text-sm font-semibold transition-all disabled:opacity-60"
              >
                {fundLoading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ DELETE CONFIRM MODAL ═════════════════════════ */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                <X size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">
                Delete Allocation?
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                This will permanently delete the{" "}
                <span className="font-semibold text-gray-700">
                  {
                    [
                      "Jan",
                      "Feb",
                      "Mar",
                      "Apr",
                      "May",
                      "Jun",
                      "Jul",
                      "Aug",
                      "Sep",
                      "Oct",
                      "Nov",
                      "Dec",
                    ][deleteTarget.month - 1]
                  }{" "}
                  {deleteTarget.year}
                </span>{" "}
                allocation of{" "}
                <span className="font-semibold text-red-600">
                  {fmt(deleteTarget.totalAllocation)}
                </span>
                .
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteFund}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-all disabled:opacity-60"
              >
                {deleteLoading ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
