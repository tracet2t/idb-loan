import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  CreditCard,
  MapPin,
  Briefcase,
  DollarSign,
  FileText,
  Paperclip,
  Send,
  X,
  CheckCircle,
} from "lucide-react";
import api from "../api/axios";

const REGIONS = [
  "Northern",
  "North Central",
  "North Western",
  "Eastern",
  "Central",
  "Western",
  "Sabaragamuwa",
  "Southern",
  "Uva",
];

const SECTORS = [
  "Agriculture",
  "Manufacturing",
  "Trade",
  "Services",
  "Tourism",
  "Construction",
  "Fisheries",
  "IT & Technology",
  "Other",
];

export default function CreateLoan() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    applicantName: "",
    nic: "",
    region: "",
    sector: "",
    amount: "",
    loanReason: "",
  });

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // ── Handlers ──────────────────────────────────────────────
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError("");
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);

    // Max 5 files
    if (files.length + selected.length > 5) {
      setError("You can upload a maximum of 5 files.");
      return;
    }

    // Max 5MB per file
    const oversized = selected.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      setError("Each file must be under 5MB.");
      return;
    }

    setFiles((prev) => [...prev, ...selected]);
    setError("");
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (
      !formData.applicantName ||
      !formData.nic ||
      !formData.region ||
      !formData.sector ||
      !formData.amount ||
      !formData.loanReason
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    try {
      setLoading(true);

      // Build FormData (required for file uploads)
      const payload = new FormData();
      payload.append("applicantName", formData.applicantName);
      payload.append("nic", formData.nic);
      payload.append("region", formData.region);
      payload.append("sector", formData.sector);
      payload.append("amount", formData.amount);
      payload.append("loanReason", formData.loanReason);
      files.forEach((file) => payload.append("proofDocuments", file));

      await api.post("/loans/apply", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setSuccess(true);
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        "Failed to submit loan. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Success Screen ─────────────────────────────────────────
  if (success) {
    return (
      <div className="p-8 max-w-xl mx-auto text-center animate-fadeIn">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12">
          <CheckCircle size={56} className="text-emerald-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Loan Submitted!
          </h2>
          <p className="text-gray-500 text-sm mb-8">
            The loan application has been submitted successfully and is now{" "}
            <span className="font-semibold text-[#e09510]">Pending</span>{" "}
            review.
          </p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                setSuccess(false);
                setFormData({
                  applicantName: "",
                  nic: "",
                  region: "",
                  sector: "",
                  amount: "",
                  loanReason: "",
                });
                setFiles([]);
              }}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
            >
              Submit Another
            </button>
            <button
              onClick={() => navigate("/applications")}
              className="px-5 py-2.5 rounded-lg bg-[#e09510] hover:bg-[#c8840e] text-white text-sm font-semibold transition-all shadow-md"
            >
              View Loan Queue
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main Form ──────────────────────────────────────────────
  return (
    <div className="p-8 max-w-4xl mx-auto animate-fadeIn">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          New Loan Application
        </h1>
        <p className="text-gray-500 text-sm">
          Fill in the details below to submit a new SME loan application.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
      >
        {/* Form Header */}
        <div className="bg-gray-50/50 p-6 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileText size={16} />
            <span className="font-semibold text-gray-700">
              Applicant & Loan Details
            </span>
          </div>
        </div>

        {/* Form Fields */}
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Applicant Name */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <User size={14} /> Applicant Name{" "}
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="applicantName"
              value={formData.applicantName}
              onChange={handleChange}
              placeholder="e.g. Mohamed Farhan"
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>

          {/* NIC */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <CreditCard size={14} /> NIC Number{" "}
              <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="nic"
              value={formData.nic}
              onChange={handleChange}
              placeholder="e.g. 901234567V"
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>

          {/* Region */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <MapPin size={14} /> Region{" "}
              <span className="text-red-400">*</span>
            </label>
            <select
              name="region"
              value={formData.region}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
            >
              <option value="">Select a region</option>
              {REGIONS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          {/* Sector */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <Briefcase size={14} /> Business Sector{" "}
              <span className="text-red-400">*</span>
            </label>
            <select
              name="sector"
              value={formData.sector}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white"
            >
              <option value="">Select a sector</option>
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* Loan Amount */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <DollarSign size={14} /> Loan Amount (LKR){" "}
              <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              placeholder="e.g. 500000"
              min="1"
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
            />
          </div>

          {/* Loan Reason */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <FileText size={14} /> Loan Purpose{" "}
              <span className="text-red-400">*</span>
            </label>
            <textarea
              name="loanReason"
              value={formData.loanReason}
              onChange={handleChange}
              placeholder="Describe the purpose of this loan..."
              rows={3}
              className="w-full border border-gray-200 rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 outline-none text-sm resize-none"
            />
          </div>

          {/* File Upload */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2 flex items-center gap-2">
              <Paperclip size={14} /> Proof Documents{" "}
              <span className="text-gray-400 normal-case font-normal">
                (Optional — max 5 files, 5MB each)
              </span>
            </label>

            {/* Drop Zone */}
            <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-[#e09510] hover:bg-amber-50/30 transition-all">
              <Paperclip size={20} className="text-gray-400 mb-1" />
              <span className="text-sm text-gray-400">
                Click to attach files
              </span>
              <span className="text-xs text-gray-300 mt-0.5">
                PDF, JPEG, PNG, Excel accepted
              </span>
              <input
                type="file"
                multiple
                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {/* Attached Files List */}
            {files.length > 0 && (
              <ul className="mt-3 space-y-2">
                {files.map((file, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-lg px-4 py-2 text-sm"
                  >
                    <span className="text-gray-600 truncate max-w-xs">
                      {file.name}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="text-gray-400 text-xs">
                        {(file.size / 1024).toFixed(1)} KB
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 flex items-center justify-between border-t border-gray-100">
          <div>
            {error && (
              <p className="text-sm font-medium text-red-600">{error}</p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate("/applications")}
              className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-lg bg-[#e09510] hover:bg-[#c8840e] text-white text-sm font-semibold flex items-center gap-2 transition-all shadow-md disabled:opacity-60"
            >
              <Send size={16} />
              {loading ? "Submitting..." : "Submit Application"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
