import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";
import client from "../api/client";
import ScoreBadge from "../components/ScoreBadge";
import StageBadge from "../components/StageBadge";
import { getInitials, getAvatarColor } from "../components/CandidateTable";

const stageOptions = [
  { value: "all", label: "All stages" },
  { value: "applied", label: "Applied" },
  { value: "scored", label: "Scored" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "interview_scheduled", label: "Interview" },
  { value: "offer_extended", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

export default function Candidates() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const rejectedCount = candidates.filter((c) => c.stage === "rejected").length;

  const stage = searchParams.get("stage") || "all";
  const search = searchParams.get("search") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const res = await client.get("/candidates", {
          params: {
            stage: stage === "all" ? undefined : stage,
            search: search || undefined,
            page,
            limit,
          },
        });
        setCandidates(res.data.candidates || []);
        setTotal(res.data.total || 0);
      } catch (err) {
        console.error("Fetch candidates error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetch();
  }, [stage, search, page]);

  const totalPages = Math.ceil(total / limit);
  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  function updateParam(key, value) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set(key, value);
    else params.delete(key);
    if (key !== "page") params.delete("page");
    setSearchParams(params);
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name or email..."
            defaultValue={search}
            onChange={(e) => updateParam("search", e.target.value)}
            className="input-field pl-10"
          />
        </div>
        <select
          value={stage}
          onChange={(e) =>
            updateParam("stage", e.target.value === "all" ? "" : e.target.value)
          }
          className="select-field w-auto min-w-[160px]"
        >
          {stageOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {!loading && rejectedCount > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-danger-500/30 bg-danger-500/10 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-danger-300">
              {rejectedCount} rejected by ATS
            </p>
            <p className="text-xs text-danger-200/80">
              These candidates are locked from stage progression.
            </p>
          </div>
          <button
            onClick={() => updateParam("stage", "rejected")}
            className="btn-secondary border-danger-500/40 text-danger-200 hover:bg-danger-500/15"
          >
            View rejected
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        {loading ? (
          <CandidatesSkeleton />
        ) : candidates.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-surface-tertiary flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <p className="text-sm font-medium text-neutral-300 mb-1">
              No candidates found
            </p>
            <p className="text-xs text-neutral-500">
              Try adjusting your filters or upload a new resume
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-700/40 bg-surface-tertiary/30">
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  AI Score
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Stage
                </th>
                <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Applied
                </th>
                <th className="text-right py-3 px-4 text-xs font-medium text-neutral-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/candidates/${c.id}`)}
                  className="border-b border-neutral-700/20 cursor-pointer transition-colors duration-150 hover:bg-surface-tertiary/50"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${getAvatarColor(c.name)}`}
                      >
                        {getInitials(c.name)}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-neutral-200">
                          {c.name}
                        </p>
                        <p className="text-xs text-neutral-500">{c.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-sm text-neutral-300">
                      {c.job_title || "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <ScoreBadge score={c.score} />
                  </td>
                  <td className="py-3 px-4">
                    <StageBadge stage={c.stage} />
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-xs text-neutral-500">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString()
                        : "—"}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/candidates/${c.id}`);
                      }}
                      className="p-2 rounded-lg text-neutral-400 hover:text-primary-400 hover:bg-primary-500/10 transition-all duration-150"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-neutral-500">
            Showing {startItem}–{endItem} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => updateParam("page", String(page - 1))}
              className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => updateParam("page", String(page + 1))}
              className="btn-secondary disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CandidatesSkeleton() {
  return (
    <div className="p-4 space-y-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="skeleton w-9 h-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <div className="skeleton h-4 w-32" />
            <div className="skeleton h-3 w-48" />
          </div>
          <div className="skeleton h-4 w-20" />
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
