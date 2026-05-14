import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FileUp,
  Loader2,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Briefcase,
} from "lucide-react";
import { API_BASE } from "../api/client";
import { useToast } from "../components/Toast";

export default function JobApply() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [job, setJob] = useState(null);
  const [jobLoading, setJobLoading] = useState(true);
  const [jobError, setJobError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    file: null,
  });

  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    fetchJob();
  }, [jobId]);

  const fetchJob = async () => {
    try {
      setJobLoading(true);
      setJobError(null);
      const res = await fetch(`${API_BASE}/jobs/${jobId}`);
      if (!res.ok) throw new Error("Job not found");
      const data = await res.json();
      setJob(data);
    } catch (err) {
      console.error("Error fetching job:", err);
      setJobError(err.message);
    } finally {
      setJobLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        setSubmitError("Only PDF files are allowed");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setSubmitError("File size must be under 5MB");
        return;
      }
      setFileName(file.name);
      setFormData((prev) => ({ ...prev, file }));
      setSubmitError("");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.file) {
      setSubmitError("Please fill in all required fields and select a PDF");
      return;
    }

    const fileFormData = new FormData();
    fileFormData.append("file", formData.file);
    fileFormData.append("name", formData.name);
    fileFormData.append("email", formData.email);
    fileFormData.append("phone", formData.phone);
    fileFormData.append("job_id", jobId);

    try {
      setUploading(true);
      setSubmitError("");

      const res = await fetch(`${API_BASE}/apply`, {
        method: "POST",
        body: fileFormData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Application failed");
      }

      const data = await res.json();
      setUploadSuccess(true);
      addToast("Application submitted successfully!", "success");

      // Redirect to candidates list after 2 seconds
      setTimeout(() => {
        navigate("/jobs");
      }, 2000);
    } catch (err) {
      console.error("Application error:", err);
      setSubmitError(err.message);
      addToast(err.message, "error");
    } finally {
      setUploading(false);
    }
  };

  if (jobLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-primary-400" />
      </div>
    );
  }

  if (jobError) {
    return (
      <div className="min-h-screen bg-surface-base py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-6">
        <button
          onClick={() => navigate("/jobs")}
          className="flex items-center gap-2 text-primary-400 hover:text-primary-700 dark:text-primary-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to jobs
        </button>
        <div className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-lg font-semibold text-neutral-200 mb-2">
            Job not found
          </h2>
          <p className="text-neutral-500">{jobError}</p>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/jobs")}
          className="flex items-center gap-2 text-primary-400 hover:text-primary-700 dark:text-primary-300 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to jobs
        </button>
        <div className="flex items-start gap-3">
          <Briefcase className="w-6 h-6 text-primary-400 mt-1 shrink-0" />
          <div>
            <h1 className="text-2xl font-bold text-neutral-50">{job.title}</h1>
            <p className="text-neutral-400 mt-1">
              Posted by {job.recruiter_name || job.recruiter_email}
            </p>
          </div>
        </div>
      </div>

      {/* Job Details */}
      <div className="card">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-neutral-300 mb-2">
              POSITION DESCRIPTION
            </h3>
            <p className="text-neutral-300 whitespace-pre-wrap">
              {job.description}
            </p>
          </div>

          {job.requirements && (
            <div>
              <h3 className="text-sm font-semibold text-neutral-300 mb-2">
                KEY REQUIREMENTS
              </h3>
              <p className="text-neutral-300 whitespace-pre-wrap">
                {job.requirements}
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-neutral-700/40">
            <p className="text-xs text-neutral-500">
              Posted {new Date(job.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {/* Application Form */}
      <div className="card">
        <h2 className="text-lg font-semibold text-neutral-50 mb-6">
          Submit Your Application
        </h2>

        {uploadSuccess ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
            <h3 className="text-lg font-semibold text-neutral-50 mb-2">
              Application Submitted!
            </h3>
            <p className="text-neutral-400 text-center">
              Your application has been received and will be reviewed by our
              team.
            </p>
            <button
              onClick={() => navigate("/jobs")}
              className="mt-6 px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              Back to jobs
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {submitError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {submitError}
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="John Doe"
                className="input-field w-full"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="john@example.com"
                className="input-field w-full"
                required
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+1 (555) 000-0000"
                className="input-field w-full"
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-neutral-300 mb-3">
                Resume (PDF) *
              </label>
              <div className="border-2 border-dashed border-neutral-600 rounded-lg p-6 text-center hover:border-primary-500 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                  required
                />
                <label htmlFor="file-input" className="cursor-pointer block">
                  <FileUp className="w-8 h-8 text-neutral-500 mx-auto mb-2" />
                  <p className="text-neutral-300 font-medium">
                    {fileName ? fileName : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-sm text-neutral-500 mt-1">
                    PDF file only, maximum 5MB
                  </p>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={uploading}
              className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>
        )}
      </div>
      </div>
    </div>
  );
}
