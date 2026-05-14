import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { Plus, Pencil, Trash2, Loader2, Briefcase } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import PostJobModal from "../components/PostJobModal";
import { API_BASE } from "../api/client";

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || `Request failed: ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

function EditJobModal({ job, onClose, onSaved }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    title: job.title || "",
    description: job.description || "",
    requirements: job.requirements || "",
    status: job.status || "active",
    score_threshold: job.score_threshold ?? 70,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.description.trim()) {
      setError("Title and description are required");
      return;
    }

    const parsedThreshold = Number.parseInt(formData.score_threshold, 10);
    if (
      !Number.isFinite(parsedThreshold) ||
      parsedThreshold < 0 ||
      parsedThreshold > 100
    ) {
      setError("ATS score threshold must be between 0 and 100");
      return;
    }

    try {
      setLoading(true);
      const updatedJob = await apiFetch(`/jobs/${job.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          status: formData.status,
          score_threshold: parsedThreshold,
        }),
      });
      onSaved(updatedJob);
    } catch (err) {
      setError(err.message || "Failed to update job");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-24 modal-backdrop-enter pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 pointer-events-auto bg-transparent"
        onClick={loading ? undefined : onClose}
        aria-label="Close editor"
      />
      <div className="relative pointer-events-auto w-full max-w-2xl rounded-2xl border border-neutral-700/50 bg-surface shadow-2xl modal-panel-enter overflow-hidden max-h-[75vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-neutral-700/40 bg-surface-secondary/90 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-neutral-50">Edit job</h2>
            <p className="text-xs text-neutral-500 mt-1">
              Update details and ATS score threshold
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-surface-tertiary hover:text-neutral-200"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-6">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Title *
            </label>
            <input
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-field w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="input-field w-full h-28 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Requirements
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              className="input-field w-full h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                ATS Score Threshold
              </label>
              <input
                type="number"
                min="0"
                max="100"
                name="score_threshold"
                value={formData.score_threshold}
                onChange={handleChange}
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="select-field w-full"
              >
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-neutral-700/40">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Pencil className="w-4 h-4" />
              )}
              Save changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function RecruiterJobs() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [deleteJob, setDeleteJob] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/jobs');
      setJobs(Array.isArray(data) ? data : []);
    } catch (err) {
      addToast(err.message || "Failed to load jobs", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]);

  const handleDelete = async () => {
    if (!deleteJob) return;
    try {
      setDeleteLoading(true);
      await apiFetch(`/jobs/${deleteJob.id}`, { method: "DELETE" });
      addToast("Job deleted successfully", "success");
      setDeleteJob(null);
      fetchJobs();
    } catch (err) {
      addToast(err.message || "Failed to delete job", "error");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleJobSaved = (updatedJob) => {
    setEditingJob(null);
    setJobs((prev) =>
      prev.map((job) => (job.id === updatedJob.id ? updatedJob : job)),
    );
    addToast("Job updated successfully", "success");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Briefcase className="w-6 h-6 text-primary-400" />
            <h1 className="text-2xl font-bold text-neutral-50">Jobs</h1>
          </div>
          <p className="text-neutral-400">
            Manage job posts and ATS score thresholds
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus className="w-4 h-4" />
          Add job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="card text-center py-16">
          <Briefcase className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-neutral-200 mb-2">
            No jobs yet
          </h2>
          <p className="text-neutral-500">
            Create a job to start tracking ATS thresholds and applications.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-surface-secondary/60 border-b border-neutral-700/40">
                <tr>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    ATS Score
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="text-right py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr
                    key={job.id}
                    className="border-b border-neutral-700/20 hover:bg-surface-tertiary/40 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <div>
                        <p className="text-sm font-semibold text-neutral-100">
                          {job.title}
                        </p>
                        <p className="text-xs text-neutral-500 mt-1 line-clamp-2">
                          {job.description}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="inline-flex items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1 text-sm font-bold text-primary-700 dark:text-primary-300">
                        {job.score_threshold ?? 70}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="inline-flex items-center rounded-full border border-success-500/30 bg-success-500/10 px-3 py-1 text-xs font-bold text-success-700 dark:text-success-300 capitalize">
                        {job.status || "active"}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm text-neutral-400">
                      {job.created_at
                        ? new Date(job.created_at).toLocaleDateString()
                        : "—"}
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          className="btn-secondary px-3 py-2"
                          onClick={() => setEditingJob(job)}
                        >
                          <Pencil className="w-4 h-4" />
                          Edit
                        </button>
                        <button
                          className="btn-secondary px-3 py-2 border-danger-500/40 text-danger-200 hover:bg-danger-500/15"
                          onClick={() => setDeleteJob(job)}
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <PostJobModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onJobPosted={() => {
          setShowCreateModal(false);
          fetchJobs();
        }}
        recruiterEmail={user?.email || ""}
        recruiterName={user?.name || "Recruiter"}
      />

      {editingJob && (
        <EditJobModal
          job={editingJob}
          onClose={() => setEditingJob(null)}
          onSaved={handleJobSaved}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteJob}
        title={`Delete ${deleteJob?.title || "job"}?`}
        description="This will remove the job from the public list and cannot be undone."
        confirmLabel="Delete job"
        cancelLabel="Keep job"
        loading={deleteLoading}
        variant="danger"
        onCancel={() => {
          if (!deleteLoading) setDeleteJob(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
}
