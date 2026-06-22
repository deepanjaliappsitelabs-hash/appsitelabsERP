import { useState } from "react";
import axios from "axios";
import { FiEye, FiEyeOff } from "react-icons/fi";

// ── Detect subdomain ──────────────────────────────────────────────────────────
const hostname  = window.location.hostname;      // "admin.localhost" | "erp.localhost" | "localhost"
const subdomain = hostname.split(".")[0];         // "admin" | "erp" | "localhost"

const isAdminPortal    = subdomain === "admin";
const isEmployeePortal = subdomain === "erp";
const isLocalDev       = !isAdminPortal && !isEmployeePortal;

// ── API URL ───────────────────────────────────────────────────────────────────
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5002";

// ── Portal config (UI text + badge) ──────────────────────────────────────────
const portalConfig = isAdminPortal
  ? {
      title:    "Admin Login",
      subtitle: "Admin portal — HR management workspace.",
      badge:    "Admin Portal",
      badgeCls: "bg-purple-50 text-purple-700 border-purple-200",
    }
  : isEmployeePortal
  ? {
      title:    "Employee Login",
      subtitle: "Employee portal — See your workspace.",
      badge:    "Employee Portal",
      badgeCls: "bg-blue-50 text-blue-700 border-blue-200",
    }
  : {
      title:    "ERP Login",
      subtitle: "Sign in to manage your HR workspace.",
      badge:    null,
      badgeCls: "",
    };

// ─────────────────────────────────────────────────────────────────────────────

function Login() {
  const [email,        setEmail]       = useState("");
  const [password,     setPassword]    = useState("");
  const [loading,      setLoading]     = useState(false);
  const [error,        setError]       = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axios.post(`${API_URL}/api/auth/login`, {
        email: email.trim(),
        password,
      });

      const data = res.data;

      // ── Portal vs Role check ──────────────────────────────────────────────
      if (isAdminPortal && data.role !== "admin") {
        setError("❌ This is  Admin portal .Here is  Employee ERP .");
        return;
      }
      if (isEmployeePortal && data.role !== "employee") {
        setError("❌ This is  Employee portal .Here is  Admin ERP .");
        return;
      }
      // ─────────────────────────────────────────────────────────────────────

      // Store session data.
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify({
        id:           data.id || data._id || data.employeeId || data.email,
        _id:          data._id || "",
        name:         data.name,
        email:        data.email,
        role:         data.role,
        employeeId:   data.employeeId   || data.id || data._id || data.email,
        employeeCode: data.employeeCode || "",
        department:   data.department   || "",
        designation:  data.designation  || "",
        phone:        data.phone        || "",
      }));

      // ✅ Redirect
      if (data.role === "admin") {
        window.location.href = isLocalDev
          ? "/admin/dashboard"
          : `${import.meta.env.VITE_ADMIN_URL || "http://admin.appsitelabs.com"}/admin/dashboard`;
        return;
      }
      if (data.role === "employee") {
        window.location.href = isLocalDev
          ? "/employee/dashboard"
          : `${import.meta.env.VITE_ERP_URL || "http://erp.appsitelabs.com"}/employee/dashboard`;
        return;
      }

      setError("Invalid user role.");

    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F6F7FB] px-4">
      <div className="w-full max-w-md rounded-2xl border border-[#E7E8F0] bg-white p-8 shadow-[0_24px_70px_rgba(48,37,104,0.10)]">

        {/* Logo */}
        <img
          src="/ASL_Official-logo.png"
          alt="AppsiteLabs"
          className="mx-auto mb-6 h-14 w-auto object-contain"
        />

        {/* Portal Badge */}
        {portalConfig.badge && (
          <div className="mb-4 flex justify-center">
            <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${portalConfig.badgeCls}`}>
              {portalConfig.badge}
            </span>
          </div>
        )}

        {/* Title */}
        <h1 className="mb-2 text-center text-2xl font-bold tracking-tight text-slate-950">
          {portalConfig.title}
        </h1>
        <p className="mb-6 text-center text-sm text-slate-500">
          {portalConfig.subtitle}
        </p>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-center text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Email or Employee ID"
            value={email}
            required
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-[#E0E3EC] p-3 text-sm outline-none transition focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10"
          />
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              required
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-[#E0E3EC] p-3 pr-11 text-sm outline-none transition focus:border-[#7560A7] focus:ring-4 focus:ring-[#302568]/10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((c) => !c)}
              className="absolute inset-y-0 right-3 flex items-center text-slate-400 transition hover:text-[#302568]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#302568] py-3 text-sm font-semibold text-white shadow-sm shadow-[#302568]/20 transition hover:bg-[#3d3080] active:bg-[#251d52] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Login"}
          </button>
        </form>

        {/* Cross portal link */}
        {isAdminPortal && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Employee ?{" "}
            <a
              href={import.meta.env.VITE_ERP_URL || "http://erp.appsitelabs.com"}
              className="font-semibold text-[#302568] hover:underline"
            >
              Open Employee portal →
            </a>
          </p>
        )}
        {isEmployeePortal && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Admin ?{" "}
            <a
              href={import.meta.env.VITE_ADMIN_URL || "http://admin.appsitelabs.com"}
              className="font-semibold text-[#302568] hover:underline"
            >
              Open Admin portal →
            </a>
          </p>
        )}

        {/* Forgot password */}
        <p className="mt-3 text-center text-xs text-slate-400">
          Forgot your password?{" "}
          <a href="/forgot-password" className="font-semibold text-[#302568] hover:underline">
            Reset it
          </a>
        </p>

      </div>
    </div>
  );
}

export default Login;
