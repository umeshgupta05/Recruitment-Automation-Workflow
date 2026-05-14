import clsx from "clsx";

const stageConfig = {
  applied: {
    label: "Applied",
    bg: "bg-neutral-500/15",
    text: "text-neutral-700 dark:text-neutral-300",
    border: "border-neutral-500/30",
  },
  scored: {
    label: "Scored",
    bg: "bg-primary-500/15",
    text: "text-primary-700 dark:text-primary-300",
    border: "border-primary-500/30",
  },
  shortlisted: {
    label: "Shortlisted",
    bg: "bg-blue-500/15",
    text: "text-blue-700 dark:text-blue-300",
    border: "border-blue-500/30",
  },
  interview_scheduled: {
    label: "Interview",
    bg: "bg-warning-500/15",
    text: "text-warning-700 dark:text-warning-300",
    border: "border-warning-500/30",
  },
  offer_extended: {
    label: "Offer",
    bg: "bg-success-500/15",
    text: "text-success-700 dark:text-success-300",
    border: "border-success-500/30",
  },
  rejected: {
    label: "Rejected",
    bg: "bg-danger-500/15",
    text: "text-danger-700 dark:text-danger-300",
    border: "border-danger-500/30",
  },
};

export default function StageBadge({ stage }) {
  const config = stageConfig[stage] || stageConfig.applied;
  return (
    <span
      className={clsx(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border",
        config.bg,
        config.text,
        config.border,
      )}
    >
      {config.label}
    </span>
  );
}

export { stageConfig };
