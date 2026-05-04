import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Lock, ShieldCheck, AlertCircle } from "lucide-react";
import toast, { Toaster } from 'react-hot-toast';
import { userService } from "../api/userService";

const SetupPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password.length < 8) {
      return toast.error("Password must be at least 8 characters long.");
    }

    if (formData.password !== formData.confirmPassword) {
      return toast.error("Passwords do not match.");
    }

    setLoading(true);
    try {
      await userService.acceptInvitation(token, formData.password);
      toast.success("Account activated! Redirecting to login...");
      
      // Small delay so they can see the success message
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      const msg = err.response?.data?.message || "Link expired or invalid.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Toaster position="top-center" />
      
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        {/* Branding/Icon */}
        <div className="w-16 h-16 bg-[#2e7d5e]/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShieldCheck size={32} className="text-[#2e7d5e]" />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Setup Your Password</h1>
          <p className="text-slate-500 text-sm mt-2">
            Welcome to the IDB Portal. Please set a secure password to activate your staff account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* New Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              New Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                name="password"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/20 focus:border-[#2e7d5e] transition text-slate-700"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="password"
                name="confirmPassword"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2e7d5e]/20 focus:border-[#2e7d5e] transition text-slate-700"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Requirements Note */}
          <div className="flex gap-2 text-[11px] text-slate-400 bg-slate-50 p-3 rounded-lg border border-slate-100">
            <AlertCircle size={14} className="shrink-0 text-slate-500" />
            <p>Ensure your password is at least 8 characters and contains a mix of letters and numbers.</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#2e7d5e] hover:bg-[#256b50] text-white font-semibold rounded-lg shadow-lg shadow-green-900/10 transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Activating...
              </span>
            ) : (
              "Activate Staff Account"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SetupPassword;