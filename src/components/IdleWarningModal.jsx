export default function IdleWarningModal({ open, onStaySignedIn }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl ring-1 ring-slate-200 overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 ring-1 ring-amber-100 grid place-items-center shrink-0">
              <svg
                width="22" height="22" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5"
                strokeLinecap="round" strokeLinejoin="round"
                className="text-amber-600"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-800">
                Still there?
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                You'll be signed out automatically in{" "}
                <strong className="text-slate-700">2 minutes</strong> due to
                inactivity.
              </p>
              <p className="text-xs text-slate-400 mt-2">
                This keeps shared computers secure.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onStaySignedIn}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 active:scale-95 shadow-sm shadow-green-200 transition"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Stay signed in
          </button>
        </div>
      </div>
    </div>
  );
}