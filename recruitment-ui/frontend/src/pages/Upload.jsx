import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import client from "../api/client";
import UploadZone from "../components/UploadZone";
import { useToast } from "../components/Toast";

const jobTitles = [
  "Backend Engineer",
  "Frontend Engineer",
  "DevOps Engineer",
  "ML Engineer",
  "Other",
];

export default function Upload() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [file, setFile] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    job_title: "",
    score_threshold: 70,
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      errs.email = "Invalid email format";
    if (!file) errs.file = "Resume PDF is required";
    const threshold = Number.parseInt(form.score_threshold, 10);
    if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100)
      errs.score_threshold = "Threshold must be between 0 and 100";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("name", form.name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("job_title", form.job_title);
      formData.append("score_threshold", String(form.score_threshold));

      const res = await client.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResult(res.data);
      addToast("Resume uploaded and scoring workflow triggered!", "success");
    } catch (err) {
      addToast(err.message || "Upload failed", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function resetForm() {
    setResult(null);
    setFile(null);
    setForm({
      name: "",
      email: "",
      phone: "",
      job_title: "",
      score_threshold: 70,
    });
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto animate-fade-in">
        <div className="card text-center py-10">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-500/15 flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success-400" />
          </div>
          <h2 className="text-xl font-bold text-neutral-100 mb-2">
            Resume Uploaded Successfully
          </h2>
          <p className="text-sm text-neutral-400 mb-1">
            Candidate ID: {result.candidateId}
          </p>
          {result.executionId && (
            <p className="text-sm text-neutral-400 mb-6">
              Workflow Execution:{" "}
              <code className="text-primary-400">{result.executionId}</code>
            </p>
          )}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => navigate(`/candidates/${result.candidateId}`)}
              className="btn-primary"
            >
              View candidate
            </button>
            <button onClick={resetForm} className="btn-secondary">
              Upload another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left — Dropzone */}
          <div className="card flex flex-col">
            <h3 className="text-sm font-semibold text-neutral-300 mb-4">
              Resume PDF
            </h3>
            <div className="flex-1">
              <UploadZone
                onFile={(f) => {
                  setFile(f);
                  if (errors.file)
                    setErrors((prev) => ({ ...prev, file: undefined }));
                }}
              />
            </div>
            {errors.file && (
              <p className="flex items-center gap-1.5 text-xs text-danger-400 mt-3">
                <AlertCircle className="w-3.5 h-3.5" />
                {errors.file}
              </p>
            )}
          </div>

          {/* Right — Form fields */}
          <div className="card">
            <h3 className="text-sm font-semibold text-neutral-300 mb-4">
              Candidate info
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Full name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => updateForm("name", e.target.value)}
                  className="input-field"
                  placeholder="e.g. Ravi Kumar"
                />
                {errors.name && (
                  <p className="text-xs text-danger-400 mt-1">{errors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Email *
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm("email", e.target.value)}
                  className="input-field"
                  placeholder="e.g. ravi@example.com"
                />
                {errors.email && (
                  <p className="text-xs text-danger-400 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  ATS score threshold
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={form.score_threshold}
                  onChange={(e) =>
                    updateForm("score_threshold", e.target.value)
                  }
                  className="input-field"
                  placeholder="70"
                />
                {errors.score_threshold && (
                  <p className="text-xs text-danger-400 mt-1">
                    {errors.score_threshold}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateForm("phone", e.target.value)}
                  className="input-field"
                  placeholder="e.g. +91-9876543210"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-400 mb-1.5">
                  Job title
                </label>
                <select
                  value={form.job_title}
                  onChange={(e) => updateForm("job_title", e.target.value)}
                  className="select-field"
                >
                  <option value="">Select role...</option>
                  {jobTitles.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full mt-6 justify-center"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit & Score Resume"
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
