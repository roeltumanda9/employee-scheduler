import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import { getMyProfile, ROLE_LABELS } from "./lib/auth";
import LoginPage from "./pages/LoginPage";
import EmployeesPage from "./pages/EmployeesPage";
import SchedulerPage from "./pages/SchedulerPage";
import { useAutoLogout } from "./lib/useAutoLogout";
import IdleWarningModal from "./components/IdleWarningModal";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [page, setPage] = useState(() => {
    const saved = localStorage.getItem("hmc_page");
    return saved === "scheduler" || saved === "employees" ? saved : "employees";
  });

  // Auto-logout after 30 minutes of inactivity (only when signed in)
  const { warning: idleWarning, staySignedIn } = useAutoLogout(!!session);

  // --- Auth bootstrap ---
  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      if (data.session) {
        const p = await getMyProfile();
        if (active) setProfile(p);
      }
      setAuthLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s);
      if (s) {
        const p = await getMyProfile();
        setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [page]);

  useEffect(() => {
    localStorage.setItem("hmc_page", page);
  }, [page]);

  useEffect(() => {
    if (sidebarOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [sidebarOpen]);

  // --- Loading ---
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  // --- Not signed in ---
  if (!session) return <LoginPage />;

  // --- Profile still loading ---
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-6 h-6 border-2 border-slate-300 border-t-green-600 rounded-full animate-spin" />
      </div>
    );
  }

  const role = profile.role;

  // Everyone can see both pages now.
  const effectivePage = page;

  const navItems = [
    { id: "employees", label: "Employees", icon: "👥" },
    { id: "scheduler", label: "Scheduler", icon: "📅" },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:sticky md:top-0 md:h-screen inset-y-0 left-0 z-50 w-64 flex flex-col transform transition-transform duration-200 ease-out
          bg-green-50/70 border-r border-green-100
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
      >
        <div className="px-5 py-5 border-b border-green-100 flex items-center justify-between">
          <div className="flex flex-col items-center text-center gap-3 w-full min-w-0">
            <img
              src="/logo.png"
              alt="Hofilena Medical Centrum"
              className="w-50 h-50 rounded-full bg-white p-0.5 shrink-0 ring-1 ring-green-100"
            />
            <div className="min-w-0 w-full">
              <h1 className="text-xl font-bold tracking-tight leading-tight text-green-900">
                Hofileña Medical Centrum
              </h1>
              <p className="text-[20px] text-green-700/70 leading-tight mt-0.5">
                Employee Scheduler
              </p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden w-8 h-8 grid place-items-center rounded-lg text-green-800 hover:bg-green-100 transition shrink-0"
            title="Close menu"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = effectivePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-green-600 text-white shadow-sm shadow-green-200"
                    : "text-green-900/80 hover:bg-green-100/70 hover:text-green-900"
                }`}
              >
                <span className="text-base">{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Footer: signed in as + role + sign out */}
        <div className="p-3 border-t border-green-100 space-y-2">
          <div className="px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-green-800/60 font-semibold">
              Signed in as
            </p>
            <p className="text-xs text-green-900 truncate">{profile.email}</p>
            <p className="text-[10px] text-green-700/70 mt-0.5">
              {ROLE_LABELS[role] || role}
            </p>
          </div>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg text-green-800 hover:bg-green-100/70 transition"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="bg-white/80 backdrop-blur border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 flex items-center gap-4 sticky top-0 z-30">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-9 h-9 grid place-items-center rounded-xl text-slate-600 hover:bg-slate-100 transition shrink-0"
            title="Open menu"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {/* Page title block */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Icon in a soft green badge */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-green-700 grid place-items-center shrink-0 shadow-sm shadow-green-200">
              {effectivePage === "employees" ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
              )}
            </div>

            {/* Text */}
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-semibold leading-tight">
                Hofilena Medical Centrum
              </p>
              <h2 className="text-lg md:text-xl font-bold text-slate-800 leading-tight truncate">
                {effectivePage === "employees" ? "Employees" : "Scheduler"}
              </h2>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6 flex-1">
          {effectivePage === "employees" ? (
            <EmployeesPage role={role} />
          ) : (
            <SchedulerPage role={role} />
          )}
        </div>
      </main>

      <IdleWarningModal open={idleWarning} onStaySignedIn={staySignedIn} />
    </div>
  );
}
