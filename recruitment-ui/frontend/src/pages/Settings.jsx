import { useState } from "react";
import {
  Settings,
  User,
  Mail,
  Building2,
  Phone,
  Lock,
  LogOut,
  Save,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { useNavigate } from "react-router-dom";

export default function SettingsProfile() {
  const navigate = useNavigate();
  const { user, logout, updateProfile } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [profileData, setProfileData] = useState({
    name: user?.name || "",
    company: user?.company || "",
    phone: user?.phone || "",
  });

  const [passwordData, setPasswordData] = useState({
    password: "",
    confirmPassword: "",
  });

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    setError("");
    setSuccess("");
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await updateProfile(profileData);
      setSuccess("Profile updated successfully!");
      addToast("Profile updated!", "success");
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!passwordData.password || !passwordData.confirmPassword) {
      setError("Both password fields are required");
      return;
    }

    if (passwordData.password !== passwordData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (passwordData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccess("");
      await updateProfile({ password: passwordData.password });
      setSuccess("Password changed successfully!");
      setPasswordData({ password: "", confirmPassword: "" });
      addToast("Password updated!", "success");
    } catch (err) {
      setError(err.message);
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    addToast("Logged out successfully", "success");
    navigate("/login");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-6 h-6 text-primary-400" />
          <h1 className="text-2xl font-bold text-neutral-50">
            Settings & Profile
          </h1>
        </div>
        <p className="text-neutral-400">Manage your account and preferences</p>
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar Navigation */}
        <div className="card h-fit">
          <nav className="space-y-1">
            {[
              { id: "profile", label: "Profile", icon: User },
              { id: "security", label: "Security", icon: Lock },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                  activeTab === item.id
                    ? "bg-primary-600/20 text-primary-400 border-l-2 border-primary-400"
                    : "text-neutral-400 hover:text-neutral-200 hover:bg-surface-tertiary"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="pt-4 border-t border-neutral-700/40 mt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-2">
          {/* Profile Tab */}
          {activeTab === "profile" && (
            <div className="card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-primary-600/30 border border-primary-500/40 flex items-center justify-center">
                  <User className="w-6 h-6 text-primary-700 dark:text-primary-300" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-50">
                    {user?.name}
                  </h2>
                  <p className="text-sm text-neutral-400">{user?.email}</p>
                </div>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    <User className="w-4 h-4 shrink-0" />
                    {success}
                  </div>
                )}

                <div className="space-y-4">
                  {/* Email (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Email Address
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-surface-tertiary border border-neutral-700/40">
                      <Mail className="w-4 h-4 text-neutral-500" />
                      <span className="text-neutral-700 dark:text-neutral-300">{user?.email}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      Email cannot be changed
                    </p>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={profileData.name}
                      onChange={handleProfileChange}
                      className="input-field w-full"
                      disabled={loading}
                    />
                  </div>

                  {/* Company */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Company
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-neutral-700/40 bg-surface-tertiary/50 hover:border-neutral-600/60 transition-colors">
                      <Building2 className="w-4 h-4 text-neutral-500" />
                      <input
                        type="text"
                        name="company"
                        value={profileData.company}
                        onChange={handleProfileChange}
                        placeholder="Your company name"
                        className="flex-1 bg-transparent border-none outline-none text-neutral-300 placeholder-neutral-500"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Phone
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-neutral-700/40 bg-surface-tertiary/50 hover:border-neutral-600/60 transition-colors">
                      <Phone className="w-4 h-4 text-neutral-500" />
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        placeholder="+1 (555) 000-0000"
                        className="flex-1 bg-transparent border-none outline-none text-neutral-300 placeholder-neutral-500"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Role (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      Role
                    </label>
                    <div className="px-3 py-2.5 rounded-lg bg-surface-tertiary border border-neutral-700/40 text-neutral-300 capitalize">
                      {user?.role}
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 pt-4 border-t border-neutral-700/40 mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="card">
              <h2 className="text-lg font-semibold text-neutral-50 mb-6 flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary-400" />
                Change Password
              </h2>

              <form
                onSubmit={handlePasswordSubmit}
                className="space-y-5 max-w-sm"
              >
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
                    <Lock className="w-4 h-4 shrink-0" />
                    {success}
                  </div>
                )}

                <div className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2">
                      New Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={passwordData.password}
                      onChange={handlePasswordChange}
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
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="••••••••"
                      className="input-field w-full"
                      required
                      disabled={loading}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 pt-4 border-t border-neutral-700/40 mt-4"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      Update Password
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
