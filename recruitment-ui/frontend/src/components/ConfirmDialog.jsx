import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";
import clsx from "clsx";

export default function ConfirmDialog({
  isOpen,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  variant = "danger",
}) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event) => {
      if (event.key === "Escape" && !loading) {
        onCancel?.();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const confirmStyles =
    variant === "danger"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : "bg-primary-600 hover:bg-primary-700 text-white";

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 modal-backdrop-enter pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 bg-transparent pointer-events-auto"
        onClick={loading ? undefined : onCancel}
        aria-label="Close dialog"
      />
      <div className="relative pointer-events-auto w-full max-w-md rounded-2xl border border-neutral-700/50 bg-surface shadow-2xl modal-panel-enter overflow-hidden">
        <div className="flex items-start gap-4 p-6 border-b border-neutral-700/40 bg-surface-secondary/70">
          <div
            className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border",
              variant === "danger"
                ? "border-red-500/30 bg-red-500/10 text-red-400"
                : "border-primary-500/30 bg-primary-500/10 text-primary-400",
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-neutral-50">{title}</h2>
            <p className="mt-1 text-sm text-neutral-400">{description}</p>
          </div>
          <button
            type="button"
            onClick={loading ? undefined : onCancel}
            className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-surface-tertiary hover:text-neutral-200 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={loading}
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3 p-6 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={clsx(
              "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              confirmStyles,
            )}
          >
            {loading ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
