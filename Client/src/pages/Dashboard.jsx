import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Wallet,
  TrendingUp,
  AlertTriangle,
  PlusCircle,
  List,
  Star,
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
  RadialBarChart,
  RadialBar,
} from "recharts";
import api from "../api/axios";

// ── Helpers ────────────────────────────────────────────────────
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
      : n;

const COLORS = [
  "#e09510",
  "#1a2535",
  "#10b981",
  "#3b82f6",
  "#f43f5e",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
];

const STATUS_COLORS = {
  Pending: "bg-yellow-100 text-yellow-700",
  "Under Review": "bg-blue-100 text-blue-700",
  Approved: "bg-emerald-100 text-emerald-700",
  Rejected: "bg-red-100 text-red-700",
};

// ── Skeleton Loader ────────────────────────────────────────────
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-200 rounded-lg ${className}`} />
);

export default function Dashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Chart toggles
  const [sectorMetric, setSectorMetric] = useState("totalAmount"); // or 'count'
  const [showLegend, setShowLegend] = useState(true);
  const [barOrientation, setBarOrientation] = useState("vertical"); // or 'horizontal'
  const [showGrid, setShowGrid] = useState(true);
  const [showStacked, setShowStacked] = useState(true);
  const [showTrend, setShowTrend] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.get("/stats");
        setData(res.data);
      } catch (err) {
        setError("Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // ── Gauge color logic ──────────────────────────────────────
  const getGaugeColor = (pct) => {
    if (pct >= 90) return "#f43f5e";
    if (pct >= 70) return "#f97316";
    return "#10b981";
  };

  if (error)
    return (
      <div className="p-8 text-center">
        <AlertTriangle size={40} className="text-red-400 mx-auto mb-3" />
        <p className="text-red-500 font-medium">{error}</p>
      </div>
    );

  const kpi = data?.kpi;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto animate-fadeIn">
      {/* ── Page Header ─────────────────────────────────────── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm">
          Real-time overview of IDB Loan Fund performance.
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 1 — KPI CARDS
      ══════════════════════════════════════════════════════ */}
      {/* Row 1 — Application Counts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {loading ? (
          [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)
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

            {/* Pending — clickable → filtered loan queue */}
            <div
              onClick={() => navigate("/applications?status=Pending")}
              className="bg-white rounded-xl shadow-sm border border-yellow-100 p-5 cursor-pointer hover:shadow-md hover:border-yellow-300 transition-all"
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
              <p className="text-xs text-yellow-400 mt-1">Click to view →</p>
            </div>

            {/* Approved — clickable → filtered loan queue */}
            <div
              onClick={() => navigate("/applications?status=Approved")}
              className="bg-white rounded-xl shadow-sm border border-emerald-100 p-5 cursor-pointer hover:shadow-md hover:border-emerald-300 transition-all"
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
              <p className="text-xs text-emerald-400 mt-1">Click to view →</p>
            </div>

            {/* Rejected */}
            <div className="bg-white rounded-xl shadow-sm border border-red-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-red-400 uppercase">
                  Rejected
                </span>
                <XCircle size={18} className="text-red-400" />
              </div>
              <p className="text-3xl font-bold text-red-500">{kpi.rejected}</p>
              <p className="text-xs text-gray-400 mt-1">Not approved</p>
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
            {/* Total Allocation */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-gray-400 uppercase">
                  Total Allocation
                </span>
                <Wallet size={18} className="text-[#e09510]" />
              </div>
              <p className="text-2xl font-bold text-gray-800">
                {fmt(kpi.totalAllocation)}
              </p>
              <p className="text-xs text-gray-400 mt-1">IDB sanctioned fund</p>
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
                {fmt(kpi.approvedAmount)}
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
                {fmt(kpi.balanceAmount)}
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
            <span
              className={`text-sm font-bold ${kpi.utilizationPct >= 90 ? "text-red-500" : kpi.utilizationPct >= 70 ? "text-orange-500" : "text-emerald-500"}`}
            >
              {kpi.utilizationPct}% Used
            </span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 rounded-full transition-all duration-700"
              style={{
                width: `${kpi.utilizationPct}%`,
                backgroundColor: getGaugeColor(kpi.utilizationPct),
              }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>LKR 0</span>
            <span>{fmt(kpi.totalAllocation)}</span>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════
          SECTION 2 — CHARTS
      ══════════════════════════════════════════════════════ */}
      <div>
        <h2 className="text-lg font-bold text-gray-700 mb-4">
          Analytics & Visualizations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* ── A. Sector-Wise Donut Chart ─────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-700">
                  Sector-Wise Allocation
                </h3>
                <p className="text-xs text-gray-400">
                  Approved loans by sector
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setSectorMetric(
                      sectorMetric === "totalAmount" ? "count" : "totalAmount",
                    )
                  }
                  className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-[#e09510] hover:text-white hover:border-[#e09510] transition-all"
                >
                  {sectorMetric === "totalAmount"
                    ? "Show Count"
                    : "Show Amount"}
                </button>
                <button
                  onClick={() => setShowLegend(!showLegend)}
                  className="text-xs px-3 py-1 rounded-full border border-gray-200 hover:bg-gray-100 transition-all"
                >
                  {showLegend ? "Hide Legend" : "Show Legend"}
                </button>
              </div>
            </div>
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={data.sectorStats}
                    dataKey={sectorMetric}
                    nameKey="_id"
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={3}
                  >
                    {data.sectorStats.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) =>
                      sectorMetric === "totalAmount" ? fmt(v) : `${v} loans`
                    }
                  />
                  {showLegend && <Legend formatter={(v) => v} />}
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── B. Regional Bar Chart ─────────────────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-700">
                  Regional Comparison
                </h3>
                <p className="text-xs text-gray-400">
                  Approved loan amounts by region
                </p>
              </div>
              <div className="flex gap-2">
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
            </div>
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                {barOrientation === "vertical" ? (
                  <BarChart data={data.regionalStats} margin={{ bottom: 20 }}>
                    {showGrid && (
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                      fill="#e09510"
                      radius={[4, 4, 0, 0]}
                      name="Amount"
                    />
                  </BarChart>
                ) : (
                  <BarChart
                    data={data.regionalStats}
                    layout="vertical"
                    margin={{ left: 20 }}
                  >
                    {showGrid && (
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
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
                      width={80}
                    />
                    <Tooltip formatter={(v) => fmt(v)} />
                    <Bar
                      dataKey="totalAmount"
                      fill="#1a2535"
                      radius={[0, 4, 4, 0]}
                      name="Amount"
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>

          {/* ── C. Monthly Trends Stacked Bar + Line ──────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-gray-700">
                  Application Volume & Trends
                </h3>
                <p className="text-xs text-gray-400">
                  Monthly application breakdown
                </p>
              </div>
              <div className="flex gap-2">
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
            </div>
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.monthlyData}>
                  {showGrid && (
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  )}
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="Pending"
                    stackId={showStacked ? "a" : undefined}
                    fill="#f59e0b"
                    radius={showStacked ? [0, 0, 0, 0] : [4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="Approved"
                    stackId={showStacked ? "a" : undefined}
                    fill="#10b981"
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
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* ── D. Financial Sustainability Gauge ────────── */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="mb-4">
              <h3 className="text-sm font-bold text-gray-700">
                Financial Sustainability
              </h3>
              <p className="text-xs text-gray-400">
                Real-time fund depletion monitor
              </p>
            </div>
            {loading ? (
              <Skeleton className="h-64" />
            ) : (
              <div className="flex flex-col items-center justify-center h-56">
                <ResponsiveContainer width="100%" height={200}>
                  <RadialBarChart
                    cx="50%"
                    cy="80%"
                    innerRadius="60%"
                    outerRadius="100%"
                    startAngle={180}
                    endAngle={0}
                    data={[
                      {
                        value: kpi.utilizationPct,
                        fill: getGaugeColor(kpi.utilizationPct),
                      },
                    ]}
                  >
                    <RadialBar
                      dataKey="value"
                      cornerRadius={8}
                      background={{ fill: "#f0f4f8" }}
                    />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-center -mt-10">
                  <p
                    className="text-3xl font-bold"
                    style={{ color: getGaugeColor(kpi.utilizationPct) }}
                  >
                    {kpi.utilizationPct}%
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {kpi.utilizationPct >= 90
                      ? "🔴 Critical — Fund nearly exhausted!"
                      : kpi.utilizationPct >= 70
                        ? "🟠 Warning — Monitor closely"
                        : "🟢 Safe - Fund utilization normal"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          SECTION 3 — RECENT ACTIVITY + QUICK ACTIONS
      ══════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

        {/* Quick Actions */}
        <div className="md:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
            <Star size={15} className="text-[#e09510]" /> Quick Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate("/new-loan")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-[#e09510] hover:bg-[#c8840e] text-white text-sm font-semibold transition-all shadow-sm"
            >
              <PlusCircle size={17} /> New Loan Application
            </button>
            <button
              onClick={() => navigate("/applications")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-all"
            >
              <List size={17} /> View Loan Queue
            </button>
            <button
              onClick={() => navigate("/applications?priority=true")}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-medium transition-all"
            >
              <Star size={17} className="text-[#e09510]" /> View Priority Loans
            </button>
          </div>

          {/* Mini Fund Summary */}
          {!loading && (
            <div className="mt-5 pt-4 border-t border-gray-100 space-y-2">
              <p className="text-xs font-bold text-gray-400 uppercase mb-2">
                Fund Summary
              </p>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Allocation</span>
                <span className="font-semibold text-gray-700">
                  {fmtShort(kpi.totalAllocation)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Disbursed</span>
                <span className="font-semibold text-emerald-600">
                  {fmtShort(kpi.approvedAmount)}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Balance</span>
                <span className="font-semibold text-blue-600">
                  {fmtShort(kpi.balanceAmount)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
