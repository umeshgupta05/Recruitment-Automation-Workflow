import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Users, UserCheck, CalendarCheck, Clock, Plus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import client from "../api/client";
import StatCard from "../components/StatCard";
import PipelineBar from "../components/PipelineBar";
import CandidateTable from "../components/CandidateTable";
import UploadZone from "../components/UploadZone";
import { StatusBadge } from "../components/WorkflowStatus";
import PostJobModal from "../components/PostJobModal";

const workflowLabels = {
  recruitment_ats_scorer: "ATS scorer",
  recruitment_stage_notifier: "Stage notifier",
  recruitment_idle_checker: "Idle checker",
  recruitment_error_handler: "Error handler",
};

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPostJobModal, setShowPostJobModal] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [statsRes, candidatesRes, wfRes] = await Promise.allSettled([
          client.get("/workflows/stats"),
          client.get("/candidates", { params: { limit: 8 } }),
          client.get("/workflows/runs"),
        ]);

        if (statsRes.status === "fulfilled") setStats(statsRes.value.data);
        if (candidatesRes.status === "fulfilled")
          setCandidates(candidatesRes.value.data.candidates || []);
        if (wfRes.status === "fulfilled") setWorkflows(wfRes.value.data || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const pipelineStages = stats
    ? [
        {
          key: "applied",
          label: "Applied",
          count: stats.applied,
          color: "bg-neutral-400",
        },
        {
          key: "scored",
          label: "Scored",
          count: stats.scored,
          color: "bg-primary-500",
        },
        {
          key: "shortlisted",
          label: "Shortlisted",
          count: stats.shortlisted,
          color: "bg-blue-500",
        },
        {
          key: "interview_scheduled",
          label: "Interview",
          count: stats.interviews,
          color: "bg-warning-500",
        },
        {
          key: "offer_extended",
          label: "Offer",
          count: stats.offers,
          color: "bg-success-500",
        },
        {
          key: "rejected",
          label: "Rejected",
          count: stats.rejected,
          color: "bg-danger-500",
        },
      ]
    : [];

  // Compute real delta text from backend-provided weekly counts
  const totalDelta = stats
    ? stats.thisWeekTotal > 0
      ? `+${stats.thisWeekTotal} this week`
      : "No new this week"
    : "";
  const interviewDelta = stats
    ? stats.thisWeekInterviews > 0
      ? `${stats.thisWeekInterviews} this week`
      : "None this week"
    : "";
  const idleDelta = stats
    ? stats.idleCount > 0
      ? "needs attention"
      : "all active"
    : "";

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-100">
            Recruitment hub
          </h2>
          <p className="text-sm text-neutral-500 mt-0.5">Powered by Kestra</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowPostJobModal(true)}
            className="btn-secondary"
          >
            <Plus className="w-4 h-4" />
            Post Job
          </button>
          <button onClick={() => navigate("/upload")} className="btn-primary">
            <Plus className="w-4 h-4" />
            New candidate
          </button>
        </div>
      </div>

      {/* Stat cards — all values from real DB queries */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total applicants"
          value={stats?.total ?? 0}
          delta={totalDelta}
          deltaType={stats?.thisWeekTotal > 0 ? "positive" : "neutral"}
          icon={Users}
          color="primary"
        />
        <StatCard
          label="Shortlisted"
          value={stats?.shortlisted ?? 0}
          delta={`${stats?.passRate ?? 0}% pass rate`}
          deltaType="neutral"
          icon={UserCheck}
          color="success"
        />
        <StatCard
          label="Interviews"
          value={stats?.interviews ?? 0}
          delta={interviewDelta}
          deltaType={stats?.thisWeekInterviews > 0 ? "positive" : "neutral"}
          icon={CalendarCheck}
          color="primary"
        />
        <StatCard
          label="Idle >14 days"
          value={stats?.idleCount ?? 0}
          delta={idleDelta}
          deltaType={stats?.idleCount > 0 ? "info" : "positive"}
          icon={Clock}
          color="warning"
        />
      </div>

      {/* Pipeline bar */}
      <PipelineBar
        stages={pipelineStages}
        onStageClick={(stage) => navigate(`/candidates?stage=${stage}`)}
      />

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Recent candidates */}
        <div className="lg:col-span-3 card">
          <h3 className="text-sm font-semibold text-neutral-300 mb-4">
            Recent candidates
          </h3>
          <CandidateTable candidates={candidates.slice(0, 8)} compact />
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Workflow runs */}
          <div className="card">
            <h3 className="text-sm font-semibold text-neutral-300 mb-4">
              Workflow runs
            </h3>
            <div className="space-y-3">
              {workflows.length > 0 ? (
                workflows.slice(0, 4).map((run, i) => (
                  <div
                    key={run.id || i}
                    className="flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          run.status === "SUCCESS"
                            ? "bg-success-400"
                            : run.status === "RUNNING"
                              ? "bg-warning-400 dot-pulse"
                              : run.status === "FAILED"
                                ? "bg-danger-400"
                                : "bg-neutral-500"
                        }`}
                      />
                      <span className="text-sm text-neutral-300 truncate">
                        {workflowLabels[run.flow_id] || run.flow_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <StatusBadge status={run.status || "IDLE"} />
                      <span className="text-xs text-neutral-500 w-16 text-right">
                        {timeAgo(run.started_at)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-neutral-500 text-center py-4">
                  No workflow runs yet
                </p>
              )}
            </div>
          </div>

          {/* Upload zone */}
          <div className="card">
            <h3 className="text-sm font-semibold text-neutral-300 mb-4">
              Upload resume
            </h3>
            <UploadZone compact onFile={() => navigate("/upload")} />
          </div>
        </div>
      </div>

      {/* Chart — real weekly data from DB */}
      <div className="card">
        <h3 className="text-sm font-semibold text-neutral-300 mb-4">
          Weekly application volume
        </h3>
        <div className="h-64">
          {stats?.weeklyVolume &&
          stats.weeklyVolume.some((w) => w.count > 0) ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.weeklyVolume} barSize={32}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  vertical={false}
                />
                <XAxis
                  dataKey="week"
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={{ stroke: "#334155" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#22262e",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                    fontSize: "13px",
                  }}
                  cursor={{ fill: "rgba(99, 102, 241, 0.08)" }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-sm text-neutral-400">
                  No application data yet
                </p>
                <p className="text-xs text-neutral-500 mt-1">
                  Upload resumes to see weekly trends
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Post Job Modal */}
      <PostJobModal
        isOpen={showPostJobModal}
        onClose={() => setShowPostJobModal(false)}
        onJobPosted={() => {
          // Optionally refresh data or just close modal
          setShowPostJobModal(false);
        }}
        recruiterEmail="recruiter@company.com"
        recruiterName="Recruiter"
      />
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="skeleton h-6 w-48 mb-2" />
          <div className="skeleton h-4 w-32" />
        </div>
        <div className="skeleton h-10 w-36 rounded-lg" />
      </div>
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card">
            <div className="skeleton h-4 w-24 mb-3" />
            <div className="skeleton h-8 w-16 mb-1" />
            <div className="skeleton h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="card">
        <div className="skeleton h-12 w-full" />
      </div>
      <div className="grid grid-cols-5 gap-6">
        <div className="col-span-3 card">
          <div className="skeleton h-4 w-32 mb-4" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-10 w-full mb-3" />
          ))}
        </div>
        <div className="col-span-2 space-y-6">
          <div className="card">
            <div className="skeleton h-4 w-28 mb-4" />
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton h-8 w-full mb-3" />
            ))}
          </div>
          <div className="card">
            <div className="skeleton h-32 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
