export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",        // "danger" | "warning" | "success"
  icon,                      // optional JSX
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const variants = {
    danger: {
      badge: "bg-rose-50 ring-rose-100 text-rose-600",
      button: "bg-rose-600 hover:bg-rose-700 shadow-rose-200",
    },
    warning: {
      badge: "bg-amber-50 ring-amber-100 text-amber-600",
      button: "bg-amber-600 hover:bg-amber-700 shadow-amber-200",
    },
    success: {
      badge: "bg-green-50 ring-green-100 text-green-600",
      button: "bg-green-600 hover:bg-green-700 shadow-green-200",
    },
  };

  const v = variants[variant] || variants.danger;

  const defaultIcon = (
    <svg
      width="22" height="22" viewBox="0 0 24 24"
      fill="none" stroke="currentColor" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round"
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ height: "100dvh", width: "100vw" }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-12 h-12 rounded-full ring-1 grid place-items-center shrink-0 ${v.badge}`}
            >
              {icon || defaultIcon}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-800">
                {title}
              </h3>
              {message && (
                <div className="text-sm text-slate-500 mt-1">{message}</div>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 rounded-xl hover:bg-slate-100 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl active:scale-95 shadow-sm transition ${v.button}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}