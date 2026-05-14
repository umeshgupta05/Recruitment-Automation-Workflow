import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlus, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { getLandingPath } from "../utils/auth";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
    company: "",
    phone: "",
    role: "candidate",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.email ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.name
    ) {
      setError("Email, password, and name are required");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await register(
        formData.email,
        formData.password,
        formData.name,
        formData.role,
        formData.company,
        formData.phone,
      );
      addToast("Registration successful!", "success");
      navigate(getLandingPath(data.role));
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-surface-base via-surface-secondary to-neutral-900 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary-600/20 border border-primary-500/30 mb-4">
            <UserPlus className="w-6 h-6 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-50">Create account</h1>
          <p className="text-neutral-400 mt-2">Join the recruitment platform</p>
        </div>

        {/* Form Card */}
        <div className="card">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="input-field w-full"
                required
                disabled={loading}
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Email address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="input-field w-full"
                required
                disabled={loading}
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Company
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Your company name"
                className="input-field w-full"
                disabled={loading}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 000-0000"
                className="input-field w-full"
                disabled={loading}
              />
            </div>


            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Password *
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-field w-full"
                required
                disabled={loading}
              />
              <p className="text-xs text-neutral-500 mt-1">
                At least 6 characters
              </p>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Confirm Password *
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="••••••••"
                className="input-field w-full"
                required
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 mt-6"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  Create account
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-neutral-700/40"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-surface-base text-neutral-400">or</span>
            </div>
          </div>

          {/* Login Link */}
          <p className="text-center text-neutral-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-primary-400 hover:text-primary-700 dark:text-primary-300 font-medium"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
