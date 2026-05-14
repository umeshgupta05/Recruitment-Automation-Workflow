import { useState } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { API_BASE } from "../api/client";
import { useToast } from "./Toast";

export default function PostJobModal({
  isOpen,
  onClose,
  onJobPosted,
  recruiterEmail,
  recruiterName,
}) {
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    requirements: "",
    score_threshold: 70,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title || !formData.description) {
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
      setError("");

      const res = await fetch(`${API_BASE}/jobs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          requirements: formData.requirements,
          recruiter_email: recruiterEmail,
          recruiter_name: recruiterName,
          score_threshold: parsedThreshold,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to post job");
      }

      const newJob = await res.json();
      addToast("Job posted successfully!", "success");
      setFormData({
        title: "",
        description: "",
        requirements: "",
        score_threshold: 70,
      });
      onJobPosted(newJob);
      onClose();
    } catch (err) {
      console.error("Error posting job:", err);
      setError(err.message);
      addToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 sticky top-0 bg-surface-base p-4 -m-4 mb-4 border-b border-neutral-700/40">
          <h2 className="text-xl font-semibold text-neutral-50">
            Post a New Job
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-surface-tertiary rounded transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Job Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="e.g., Senior Full Stack Developer"
              className="input-field w-full"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Job Description *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the job, responsibilities, and what you're looking for..."
              className="input-field w-full h-32 resize-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Key Requirements
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="Required skills, experience level, education, etc."
              className="input-field w-full h-24 resize-none"
            />
          </div>

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
              placeholder="70"
            />
            <p className="mt-1 text-xs text-neutral-500">
              Candidates below this score can be flagged by the workflow.
            </p>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-neutral-700/40">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-neutral-300 hover:bg-surface-tertiary transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Posting...
                </>
              ) : (
                "Post Job"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
