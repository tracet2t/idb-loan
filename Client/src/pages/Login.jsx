import { useState } from "react";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";
import emblem from "../assets/emblem.png";
import idb from "../assets/idb.png";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setError("");
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", form);
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("isFirstLogin", res.data.isFirstLogin);

      const { role, isFirstLogin } = res.data;

      if (role === "data-entry") {
        if (isFirstLogin) {
          navigate("/my-profile");
        } else {
          navigate("/applications");
        }
      } else if (role === "super-admin") {
        navigate("/dashboard");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      if (err.response) {
        setError(err.response.data.message || "Invalid email or password.");
      } else {
        setError("Network error. Please check your connection.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <div className="h-2 bg-[#8B0000] w-full" />
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-10 pt-10 pb-6 text-center">
            <div className="flex items-center justify-center gap-5 mb-5">
              <img src={emblem} alt="Sri Lanka Emblem" className="w-14 h-14 object-contain" />
              <div className="text-center">
                <p className="text-[#1B3A7A] text-sm font-bold tracking-wide uppercase leading-tight">Industrial</p>
                <p className="text-[#1B3A7A] text-sm font-bold tracking-wide uppercase leading-tight">Development Board</p>
                <p className="text-gray-500 text-[10px] mt-1 leading-snug">
                  Ministry of Industry and Entrepreneurship<br />Development
                </p>
              </div>
              <img src={idb} alt="IDB Logo" className="w-14 h-14 object-contain rounded-lg" />
            </div>
            <div className="border-t border-gray-100 mb-6" />
            <h1 className="text-[#1B3A7A] text-2xl font-bold tracking-wide">Sign In</h1>
          </div>

          <div className="px-10 pb-10">
            {error && (
              <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-lg text-sm">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="email" name="email" value={form.email} onChange={handleChange}
                required autoComplete="email" placeholder="Username"
                className="w-full px-4 py-3 bg-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B3A7A] focus:bg-white transition"
              />
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"} name="password"
                  value={form.password} onChange={handleChange}
                  required autoComplete="current-password" placeholder="Password"
                  className="w-full px-4 py-3 pr-16 bg-gray-200 rounded-lg text-sm text-gray-700 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B3A7A] focus:bg-white transition"
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-xs font-semibold hover:text-gray-700 transition">
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              <div className="flex justify-end -mt-1">
                <button type="button" className="text-xs text-gray-500 hover:text-[#1B3A7A] transition">
                  Forgot password?
                </button>
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-3 bg-[#F5A623] hover:bg-[#e09510] active:bg-[#c8840e] text-white font-bold text-base rounded-lg transition-all duration-200 shadow-sm disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}