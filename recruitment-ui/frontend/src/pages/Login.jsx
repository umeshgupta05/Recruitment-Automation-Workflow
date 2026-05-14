import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogIn, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { getLandingPath } from "../utils/auth";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { addToast } = useToast();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
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

    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const data = await login(formData.email, formData.password);
      addToast("Logged in successfully!", "success");
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
            <LogIn className="w-6 h-6 text-primary-400" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-50">Welcome back</h1>
          <p className="text-neutral-400 mt-2">
            Sign in to your recruitment account
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Email address
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Password
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
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Sign in
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

          {/* Register Link */}
          <p className="text-center text-neutral-400">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-primary-400 hover:text-primary-700 dark:text-primary-300 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>

        {/* Demo Credentials */}
        <div className="mt-6 p-4 rounded-lg bg-surface-secondary/50 border border-neutral-700/40">
          <p className="text-xs font-semibold text-neutral-400 mb-2">
            Demo credentials:
          </p>
          <p className="text-xs text-neutral-500">
            Email: <code className="text-primary-700 dark:text-primary-300">demo@company.com</code>
          </p>
          <p className="text-xs text-neutral-500">
            Password: <code className="text-primary-700 dark:text-primary-300">password123</code>
          </p>
        </div>
      </div>
    </div>
  );
}
