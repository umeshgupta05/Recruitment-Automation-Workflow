import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  AlertTriangle,
  ChevronRight,
  RefreshCw,
  Trash2,
  Save,
  Loader2,
} from "lucide-react";
import clsx from "clsx";
import client from "../api/client";
import StageBadge from "../components/StageBadge";
import WorkflowStatus from "../components/WorkflowStatus";
import { getInitials, getAvatarColor } from "../components/CandidateTable";
import { getScoreColor } from "../components/ScoreBadge";
import { useToast } from "../components/Toast";
import ConfirmDialog from "../components/ConfirmDialog";

const STAGES = [
  "applied",
  "scored",
  "shortlisted",
  "interview_scheduled",
  "offer_extended",
];
const STAGE_LABELS = {
  applied: "Applied",
  scored: "Scored",
  shortlisted: "Shortlisted",
  interview_scheduled: "Interview",
  offer_extended: "Offer",
};

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [candidate, setCandidate] = useState(null);
  const [execution, setExecution] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [stageLoading, setStageLoading] = useState(false);
  const [notesLoading, setNotesLoading] = useState(false);
  const [retryLoading, setRetryLoading] = useState(false);
  const [refreshLoading, setRefreshLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const prevStageRef = useRef(null);

  const fetchCandidate = useCallback(async () => {
    try {
      const res = await client.get(`/candidates/${id}`);
      setCandidate(res.data);
      setNotes(res.data.notes || "");
    } catch (err) {
      console.error("Fetch candidate error:", err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCandidate();
  }, [fetchCandidate]);

  const refreshExecution = useCallback(async () => {
    if (!candidate?.kestra_execution_id) return null;
    const res = await client.get(
      `/workflows/execution/${candidate.kestra_execution_id}`,
    );
    const status =
      res.data.execution?.state?.current || res.data.execution?.status;
    setExecution(res.data.execution);
    if (
      status === "SUCCESS" ||
      status === "FAILED" ||
      status === "ERROR" ||
      status === "KILLED"
    ) {
      await fetchCandidate();
    }
    return status;
  }, [candidate?.kestra_execution_id, fetchCandidate]);

  // Poll execution status
  useEffect(() => {
    if (!candidate?.kestra_execution_id) return;

    let interval;
    async function pollExecution() {
      try {
        const status = await refreshExecution();
        if (
          status === "SUCCESS" ||
          status === "FAILED" ||
          status === "ERROR" ||
          status === "KILLED"
        ) {
          clearInterval(interval);
        }
      } catch {
        // Kestra might not be running; don't crash
      }
    }

    pollExecution();
    interval = setInterval(pollExecution, 3000);
    return () => clearInterval(interval);
  }, [candidate?.kestra_execution_id, refreshExecution]);

  useEffect(() => {
    if (!candidate) return;
    if (
      prevStageRef.current &&
      prevStageRef.current !== candidate.stage &&
      candidate.stage === "rejected"
    ) {
      addToast("Candidate rejected by ATS", "error");
    }
    prevStageRef.current = candidate.stage;
  }, [candidate, addToast]);

  async function handleStageAdvance() {
    if (!candidate || candidate.stage === "rejected") return;
    const currentIdx = STAGES.indexOf(candidate.stage);
    if (currentIdx < 0 || currentIdx >= STAGES.length - 1) return;

    const newStage = STAGES[currentIdx + 1];
    setStageLoading(true);
    try {
      const res = await client.patch(`/candidates/${id}/stage`, {
        new_stage: newStage,
      });
      setCandidate(res.data.candidate);
      addToast(`Stage updated to ${STAGE_LABELS[newStage]}`, "success");
    } catch (err) {
      addToast(`Failed to update stage: ${err.message}`, "error");
    } finally {
      setStageLoading(false);
    }
  }

  async function handleSaveNotes() {
    setNotesLoading(true);
    try {
      await client.patch(`/candidates/${id}/notes`, { notes });
      addToast("Notes saved", "success");
    } catch (err) {
      addToast(`Failed to save notes: ${err.message}`, "error");
    } finally {
      setNotesLoading(false);
    }
  }

  async function handleRetryExecution() {
    if (!candidate) return;
    setRetryLoading(true);
    try {
      await client.post(`/workflows/retry-ats/${candidate.id}`);
      addToast("ATS retry started", "success");
      setExecution(null);
      await fetchCandidate();
    } catch (err) {
      addToast(`Retry failed: ${err.message}`, "error");
    } finally {
      setRetryLoading(false);
    }
  }

  async function handleRefreshExecution() {
    setRefreshLoading(true);
    try {
      await refreshExecution();
    } catch (err) {
      addToast(`Refresh failed: ${err.message}`, "error");
    } finally {
      setRefreshLoading(false);
    }
  }

  async function handleDeleteCandidate() {
    if (!candidate) return;
    setDeleteLoading(true);
    try {
      await client.delete(`/candidates/${candidate.id}`);
      addToast("Candidate deleted", "success");
      navigate("/candidates");
    } catch (err) {
      addToast(`Delete failed: ${err.message}`, "error");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (loading) return <DetailSkeleton />;
  if (!candidate) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-400">Candidate not found</p>
      </div>
    );
  }

  const strengths = safeJsonParse(candidate.strengths);
  const gaps = safeJsonParse(candidate.gaps);
  const hasScore =
    candidate.score !== null &&
    candidate.score !== undefined &&
    !isNaN(candidate.score);
  const scoreColors = hasScore
    ? getScoreColor(candidate.score)
    : { text: "text-neutral-400" };
  const strokeOffset = hasScore
    ? 283 - (283 * Math.min(candidate.score, 100)) / 100
    : 283;

  const executionStatus =
    execution?.state?.current || execution?.status || "UNKNOWN";

  const isRejected = candidate.stage === "rejected";

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 animate-fade-in">
        {/* Left column — Candidate card */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card text-center">
            <div
              className={`w-20 h-20 mx-auto rounded-full border-2 flex items-center justify-center text-2xl font-bold mb-4 ${getAvatarColor(candidate.name)}`}
            >
              {getInitials(candidate.name)}
            </div>
            <h2 className="text-xl font-bold text-neutral-100">
              {candidate.name}
            </h2>
            <p className="text-sm text-neutral-400 mt-1">
              {candidate.job_title || "No role specified"}
            </p>

            <div className="flex items-center justify-center gap-4 mt-4 text-sm text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" />
                {candidate.email}
              </span>
            </div>
            <div className="flex items-center justify-center gap-4 mt-2 text-sm text-neutral-400">
              {candidate.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  {candidate.phone}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(candidate.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* AI Score Gauge */}
          <div className="card">
            <h3 className="text-sm font-semibold text-neutral-300 mb-4 text-center">
              AI Score
            </h3>
            <div className="flex justify-center">
              <div className="relative w-36 h-36">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="#334155"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={
                      hasScore
                        ? candidate.score >= 85
                          ? "#10b981"
                          : candidate.score >= 70
                            ? "#f59e0b"
                            : "#ef4444"
                        : "#64748b"
                    }
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="283"
                    strokeDashoffset={strokeOffset}
                    className={hasScore ? "gauge-animated" : ""}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    className={clsx("text-3xl font-bold", scoreColors.text)}
                  >
                    {hasScore ? candidate.score : "—"}
                  </span>
                </div>
              </div>
            </div>
            {!hasScore && (
              <p className="text-xs text-neutral-500 text-center mt-3">
                Workflow in progress...
              </p>
            )}
          </div>

          {/* Strengths & Gaps */}
          <div className="card">
            <h3 className="text-sm font-semibold text-neutral-300 mb-3">
              Strengths
            </h3>
            {strengths.length > 0 ? (
              <ul className="space-y-2 mb-5">
                {strengths.map((s, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-neutral-300"
                  >
                    <CheckCircle className="w-4 h-4 text-success-400 shrink-0 mt-0.5" />
                    {s}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500 mb-5">No strengths data</p>
            )}

            <h3 className="text-sm font-semibold text-neutral-300 mb-3">
              Gaps
            </h3>
            {gaps.length > 0 ? (
              <ul className="space-y-2 mb-5">
                {gaps.map((g, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2 text-sm text-neutral-300"
                  >
                    <AlertTriangle className="w-4 h-4 text-warning-400 shrink-0 mt-0.5" />
                    {g}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-neutral-500 mb-5">
                No gaps identified
              </p>
            )}

            {candidate.ai_recommendation && (
              <>
                <h3 className="text-sm font-semibold text-neutral-300 mb-2">
                  AI Recommendation
                </h3>
                <p className="text-sm text-neutral-400 leading-relaxed bg-surface-tertiary/50 rounded-lg p-3 border border-neutral-700/30">
                  {candidate.ai_recommendation}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {isRejected && (
              <div className="flex items-center gap-2 rounded-lg border border-danger-500/30 bg-danger-500/10 px-3 py-2 text-sm font-semibold text-danger-200">
                <AlertTriangle className="w-4 h-4" />
                Rejected by ATS scoring workflow
              </div>
            )}
            <button
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleteLoading}
              className="btn-secondary border-danger-500/40 text-danger-200 hover:bg-danger-500/15 disabled:opacity-40 disabled:cursor-not-allowed font-semibold"
            >
              {deleteLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Delete candidate
            </button>
          </div>

          {/* Stage stepper */}
          <div className="card">
            <h3 className="text-sm font-semibold text-neutral-300 mb-4">
              Pipeline stage
            </h3>
            <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-2">
              {STAGES.map((stg, i) => {
                const currentIdx = STAGES.indexOf(candidate.stage);
                const isActive = stg === candidate.stage;
                const isPast = i < currentIdx;
                const isRejected = candidate.stage === "rejected";

                return (
                  <div key={stg} className="flex items-center">
                    <div
                      className={clsx(
                        "px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                        isActive && !isRejected
                          ? "bg-primary-600/20 text-primary-700 dark:text-primary-300 border border-primary-500/30"
                          : isPast
                            ? "bg-success-600/10 text-success-400 border border-success-500/20"
                            : "bg-surface-tertiary text-neutral-500 border border-neutral-700/30",
                      )}
                    >
                      {STAGE_LABELS[stg]}
                    </div>
                    {i < STAGES.length - 1 && (
                      <ChevronRight className="w-4 h-4 text-neutral-600 mx-1 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {candidate.stage === "rejected" ? (
              <div className="flex items-center gap-2 text-sm text-danger-400">
                <StageBadge stage="rejected" />
                <span>Rejected by ATS scoring workflow</span>
              </div>
            ) : (
              <button
                onClick={handleStageAdvance}
                disabled={
                  stageLoading ||
                  STAGES.indexOf(candidate.stage) >= STAGES.length - 1
                }
                className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {stageLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
                Move to next stage
              </button>
            )}
          </div>

          {/* Workflow timeline */}
          <div className="card">
            <h3 className="text-sm font-semibold text-neutral-300 mb-4">
              Workflow execution
            </h3>
            {execution ? (
              <>
                <WorkflowStatus execution={execution} />
                <div className="flex flex-wrap gap-3 mt-4">
                  <button
                    onClick={handleRefreshExecution}
                    disabled={refreshLoading}
                    className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {refreshLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Refresh status
                  </button>
                  <button
                    onClick={handleRetryExecution}
                    disabled={retryLoading}
                    className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {retryLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4" />
                    )}
                    Retry
                  </button>
                </div>
              </>
            ) : candidate.kestra_execution_id ? (
              <div className="flex items-center gap-2 text-sm text-neutral-400">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connecting to Kestra...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-neutral-500">
                  No workflow execution linked to this candidate
                </p>
                <button
                  onClick={handleRetryExecution}
                  disabled={retryLoading || !candidate?.resume_text}
                  className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {retryLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Retry ATS scoring
                </button>
                {!candidate?.resume_text && (
                  <p className="text-xs text-neutral-500">
                    Retry is unavailable because the resume text was not saved.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="card">
            <h3 className="text-sm font-semibold text-neutral-300 mb-3">
              Notes
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this candidate..."
              rows={5}
              className="input-field resize-none mb-3"
            />
            <button
              onClick={handleSaveNotes}
              disabled={notesLoading}
              className="btn-secondary"
            >
              {notesLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save notes
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={deleteDialogOpen}
        title={`Delete ${candidate?.name || "candidate"}?`}
        description="This will permanently remove the candidate record and cannot be undone."
        confirmLabel="Delete candidate"
        cancelLabel="Keep candidate"
        loading={deleteLoading}
        variant="danger"
        onCancel={() => {
          if (!deleteLoading) setDeleteDialogOpen(false);
        }}
        onConfirm={async () => {
          setDeleteDialogOpen(false);
          await handleDeleteCandidate();
        }}
      />
    </>
  );
}

function safeJsonParse(str) {
  if (!str) return [];
  try {
    const parsed = JSON.parse(str);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-5 gap-6">
      <div className="col-span-2 space-y-6">
        <div className="card text-center">
          <div className="skeleton w-20 h-20 mx-auto rounded-full mb-4" />
          <div className="skeleton h-6 w-40 mx-auto mb-2" />
          <div className="skeleton h-4 w-32 mx-auto" />
        </div>
        <div className="card flex justify-center">
          <div className="skeleton w-36 h-36 rounded-full" />
        </div>
        <div className="card space-y-3">
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-full" />
          <div className="skeleton h-4 w-3/4" />
        </div>
      </div>
      <div className="col-span-3 space-y-6">
        <div className="card">
          <div className="skeleton h-4 w-28 mb-4" />
          <div className="flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="skeleton h-8 w-24 rounded-lg" />
            ))}
          </div>
        </div>
        <div className="card">
          <div className="skeleton h-4 w-36 mb-4" />
          <div className="skeleton h-24 w-full" />
        </div>
        <div className="card">
          <div className="skeleton h-4 w-16 mb-3" />
          <div className="skeleton h-28 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}
