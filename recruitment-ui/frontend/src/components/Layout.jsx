import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { Bell, RefreshCw, Sun, Moon, User, LogOut } from "lucide-react";
import clsx from "clsx";
import Sidebar from "./Sidebar";
import client from "../api/client";
import { getStatusConfig } from "./WorkflowStatus";
import { useAuth } from "../context/AuthContext";
import { normalizeRole } from "../utils/auth";

const titles = {
  "/": "Dashboard",
  "/candidates": "Candidates",
  "/dashboard/jobs": "Jobs",
  "/upload": "Upload Resume",
  "/workflows": "Workflows",
  "/settings": "Settings",
};

const FLOW_LABELS = {
  wf1_ats_scorer: "ATS Scorer",
  wf2_stage_notifier: "Stage Notifier",
  wf3_idle_checker: "Idle Checker",
  wf4_error_handler: "Error Handler",
};

function getTitle(pathname) {
  if (pathname.startsWith("/candidates/")) return "Candidate Detail";
  return titles[pathname] || "Recruitment Hub";
}

function getHealthConfig(status) {
  switch (status) {
    case "ok":
      return {
        label: "Kestra ok",
        dot: "bg-success-400",
        text: "text-success-700 dark:text-success-300",
        bg: "bg-success-500/10",
        border: "border-success-500/30",
      };
    case "missing_auth":
      return {
        label: "Kestra auth",
        dot: "bg-warning-400",
        text: "text-warning-700 dark:text-warning-300",
        bg: "bg-warning-500/10",
        border: "border-warning-500/30",
      };
    case "error":
      return {
        label: "Kestra down",
        dot: "bg-danger-400",
        text: "text-danger-700 dark:text-danger-300",
        bg: "bg-danger-500/10",
        border: "border-danger-500/30",
      };
    default:
      return {
        label: "Kestra check",
        dot: "bg-neutral-400",
        text: "text-neutral-700 dark:text-neutral-300",
        bg: "bg-neutral-500/10",
        border: "border-neutral-500/30",
      };
  }
}

function timeAgo(dateStr) {
  if (!dateStr) return "—";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const role = normalizeRole(user?.role);
  const title = getTitle(location.pathname);
  const [theme, setTheme] = useState(() => {
    if (typeof window === "undefined") return "dark";
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });
  const [kestraHealth, setKestraHealth] = useState({ status: "loading" });
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [notificationsLoading, setNotificationsLoading] = useState(false);
  const [notificationsError, setNotificationsError] = useState("");
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const healthCfg = getHealthConfig(kestraHealth.status);
  const hasAlerts =
    role !== "candidate" &&
    notifications.some((item) =>
      ["FAILED", "ERROR", "KILLED"].includes(item.status),
    );
  const healthBadgeClassName = clsx(
    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border",
    healthCfg.bg,
    healthCfg.border,
    healthCfg.text,
    theme === "light" && "font-semibold shadow-sm",
    theme === "light" &&
      (kestraHealth.status === "ok"
        ? "bg-success-500/15 border-success-500/40 text-success-700"
        : kestraHealth.status === "missing_auth"
          ? "bg-warning-500/15 border-warning-500/40 text-warning-700"
          : kestraHealth.status === "error"
            ? "bg-danger-500/15 border-danger-500/40 text-red-700"
            : "bg-neutral-500/15 border-neutral-500/40 text-neutral-700"),
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
    }
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const fetchNotifications = useCallback(async () => {
    setNotificationsLoading(true);
    setNotificationsError("");
    try {
      const res = await client.get("/workflows/runs");
      const runs = Array.isArray(res.data) ? res.data : [];
      const items = runs.slice(0, 6).map((run) => {
        const status = String(run.status || "UNKNOWN").toUpperCase();
        return {
          id: run.id,
          flowId: run.flow_id,
          title: FLOW_LABELS[run.flow_id] || run.flow_id,
          status,
          startedAt: run.started_at,
          candidateEmail: run.candidate_email || "",
          executionId: run.execution_id || "",
          triggerReason: run.trigger_reason || "",
        };
      });
      setNotifications(items);
    } catch (err) {
      setNotificationsError(err.message);
    } finally {
      setNotificationsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function fetchHealth() {
      try {
        const res = await client.get("/workflows/health");
        if (!active) return;
        setKestraHealth({
          status: res.data?.status || "error",
          flows: res.data?.flows || 0,
        });
      } catch (err) {
        if (!active) return;
        setKestraHealth({ status: "error", message: err.message });
      }
    }

    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!notificationsOpen) return;
    fetchNotifications();
  }, [notificationsOpen, fetchNotifications]);

  useEffect(() => {
    if (!notificationsOpen) return;
    function handleClickOutside(event) {
      if (
        notificationsRef.current &&
        !notificationsRef.current.contains(event.target)
      ) {
        setNotificationsOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === "Escape") setNotificationsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [notificationsOpen]);

  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    }
    function handleEscape(event) {
      if (event.key === "Escape") setUserMenuOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [userMenuOpen]);

  function handleNotificationClick(item) {
    if (item.candidateEmail) {
      navigate(`/candidates?search=${encodeURIComponent(item.candidateEmail)}`);
    } else {
      navigate("/workflows");
    }
    setNotificationsOpen(false);
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 ml-[56px]">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-14 bg-surface/80 backdrop-blur-md border-b border-neutral-700/40 flex items-center justify-between px-6">
          <div>
            <h1 className="text-lg font-semibold text-neutral-100">{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            {role !== "candidate" && (
              <span
                className={healthBadgeClassName}
                title={kestraHealth.message || ""}
              >
                <span
                  className={clsx("w-1.5 h-1.5 rounded-full", healthCfg.dot)}
                />
                {healthCfg.label}
              </span>
            )}
            <span className="text-xs text-neutral-500 hidden sm:block">
              {today}
            </span>
            <button
              onClick={() =>
                setTheme((current) => (current === "dark" ? "light" : "dark"))
              }
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-300 hover:bg-surface-tertiary transition-colors text-sm font-semibold"
              aria-label="Toggle theme"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </button>
            {role !== "candidate" && (
              <div className="relative" ref={notificationsRef}>
                <button
                  onClick={() => setNotificationsOpen((open) => !open)}
                  className="relative p-2 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-surface-tertiary transition-all duration-200"
                  aria-label="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {hasAlerts && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full" />
                  )}
                </button>
                {notificationsOpen && (
                  <div className="absolute right-0 mt-3 w-[340px] rounded-xl border border-neutral-700/50 bg-surface shadow-xl overflow-hidden z-40">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-700/40">
                      <div>
                        <p className="text-sm font-semibold text-neutral-200">
                          Notifications
                        </p>
                        <p className="text-xs text-neutral-500">
                          Recent workflow activity
                        </p>
                      </div>
                      <button
                        onClick={fetchNotifications}
                        className="btn-secondary px-2"
                        disabled={notificationsLoading}
                        aria-label="Refresh notifications"
                      >
                        <RefreshCw
                          className={clsx(
                            "w-4 h-4",
                            notificationsLoading && "animate-spin",
                          )}
                        />
                      </button>
                    </div>

                    <div className="max-h-[320px] overflow-y-auto">
                      {notificationsLoading ? (
                        <div className="p-4 text-sm text-neutral-500">
                          Loading notifications...
                        </div>
                      ) : notificationsError ? (
                        <div className="p-4 text-sm text-danger-700 dark:text-danger-300">
                          {notificationsError}
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="p-4 text-sm text-neutral-500">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((item) => {
                          const cfg = getStatusConfig(item.status);
                          return (
                            <button
                              key={item.id}
                              onClick={() => handleNotificationClick(item)}
                              className="w-full text-left px-4 py-3 border-b border-neutral-700/30 hover:bg-surface-tertiary/60 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <p className="text-sm text-neutral-200 font-medium">
                                    {item.title}
                                  </p>
                                  <p className="text-xs text-neutral-500 mt-0.5">
                                    {item.candidateEmail ||
                                      item.triggerReason ||
                                      "No candidate"}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span
                                    className={clsx(
                                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border",
                                      cfg.bgBadge,
                                      cfg.text,
                                    )}
                                  >
                                    <span
                                      className={clsx(
                                        "w-1.5 h-1.5 rounded-full",
                                        cfg.dot,
                                      )}
                                    />
                                    {cfg.label}
                                  </span>
                                  <p className="text-[11px] text-neutral-500 mt-2">
                                    {timeAgo(item.startedAt)}
                                  </p>
                                </div>
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>

                    <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-700/40">
                      <button
                        onClick={() => {
                          navigate("/workflows");
                          setNotificationsOpen(false);
                        }}
                        className="text-xs text-primary-700 dark:text-primary-300 hover:text-primary-200"
                      >
                        View workflows
                      </button>
                      <button
                        onClick={() => {
                          navigate("/candidates");
                          setNotificationsOpen(false);
                        }}
                        className="text-xs text-neutral-400 hover:text-neutral-200"
                      >
                        View candidates
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setUserMenuOpen((open) => !open)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-600 text-white border border-primary-500 shadow-sm hover:bg-primary-700 transition-colors font-semibold"
                aria-label="User menu"
                title={user?.name}
              >
                {user?.name?.charAt(0).toUpperCase()}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-3 w-[220px] rounded-xl border border-neutral-700/50 bg-surface shadow-xl overflow-hidden z-40">
                  <div className="px-4 py-3 border-b border-neutral-700/40">
                    <p className="text-sm font-semibold text-neutral-200">
                      {user?.name}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {user?.email}
                    </p>
                  </div>
                  <div className="space-y-1 p-2">
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-neutral-300 hover:bg-surface-tertiary transition-colors text-sm font-semibold"
                    >
                      <User className="w-4 h-4" />
                      Settings & Profile
                    </button>
                    <button
                      onClick={() => {
                        logout();
                        navigate("/login");
                        setUserMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-600 hover:bg-red-500/10 transition-colors text-sm font-semibold"
                    >
                      <LogOut className="w-4 h-4" />
                      Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
