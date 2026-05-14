import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Briefcase,
  ArrowRight,
  Loader2,
  AlertCircle,
  LogOut,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { API_BASE } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { normalizeRole } from "../utils/auth";

export default function JobsListing() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();
  const role = normalizeRole(user?.role);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_BASE}/jobs`);
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = await res.json();
      setJobs(data || []);
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-6 h-6 text-primary-400" />
            <h1 className="text-2xl font-bold text-neutral-50">
              Available Positions
            </h1>
          </div>
          <p className="text-neutral-400">
            Find and apply to open job positions
          </p>
        </div>
        {isAuthenticated && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
            {role !== "candidate" && (
              <button
                onClick={() => navigate("/dashboard")}
                className="btn-secondary"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </button>
            )}
            <button
              onClick={() => navigate("/settings")}
              className="btn-secondary"
            >
              <Settings className="w-4 h-4" />
              Profile
            </button>
            <button
              onClick={() => {
                logout();
                navigate("/login");
              }}
              className="btn-secondary"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4">
          <Briefcase className="w-12 h-12 text-neutral-600 mb-4" />
          <h2 className="text-lg font-semibold text-neutral-200 mb-2">
            No jobs available
          </h2>
          <p className="text-neutral-500 text-center">
            Check back soon for new opportunities
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="card group hover:border-primary-500/50 transition-all duration-300 cursor-pointer"
              onClick={() => navigate(`/jobs/${job.id}/apply`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-neutral-50 mb-1 group-hover:text-primary-700 dark:text-primary-300 transition-colors">
                    {job.title}
                  </h3>
                  <p className="text-sm text-neutral-400 mb-3">
                    Posted by {job.recruiter_name || job.recruiter_email}
                  </p>
                  <p className="text-neutral-300 line-clamp-2 mb-4">
                    {job.description}
                  </p>

                  {job.requirements && (
                    <div className="mb-4">
                      <p className="text-xs font-semibold text-neutral-400 mb-2">
                        KEY REQUIREMENTS:
                      </p>
                      <p className="text-sm text-neutral-400 line-clamp-2">
                        {job.requirements}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-neutral-500">
                    Posted {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div className="ml-4 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/jobs/${job.id}/apply`);
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors group-hover:shadow-lg group-hover:shadow-primary-600/50"
                  >
                    Apply
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </div>
    </div>
  );
}
