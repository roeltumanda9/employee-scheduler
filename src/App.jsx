import { useEffect, useState } from "react";
import EmployeesPage from "./pages/EmployeesPage";
import SchedulerPage from "./pages/SchedulerPage";

export default function App() {
  const [page, setPage] = useState(() => {
  const saved = localStorage.getItem("hmc_page");
  return saved === "scheduler" || saved === "employees" ? saved : "employees";
});
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const navItems = [
    { id: "employees", label: "Employees", icon: "👥" },
    { id: "scheduler", label: "Scheduler", icon: "📅" },
  ];

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Mobile backdrop */}
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
        {/* Header */}
        <div className="px-5 py-5 border-b border-green-100 flex items-center justify-between">
          <div className="flex flex-col items-center text-center gap-3 w-full min-w-0">
  <img
    src="/logo.png"
    alt="Hofilena Medical Centre"
    className="w-40 h-40 rounded-full bg-white p-0.5 shrink-0 ring-1 ring-green-100"
  />
  <div className="min-w-0 w-full">
  <h1 className="text-xl font-bold tracking-tight leading-tight text-green-900">
    Hofilena Medical Centrum
  </h1>
  <p className="text-sm text-green-700/70 leading-tight mt-1">
    Employee Scheduler
  </p>
</div>
</div>

          {/* Close button (mobile) */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden w-8 h-8 grid place-items-center rounded-lg text-green-800 hover:bg-green-100 transition shrink-0"
            title="Close menu"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const active = page === item.id;
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

        {/* Footer */}
        <div className="p-4 text-[11px] text-green-800/60 border-t border-green-100">
          v1.0
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0 flex flex-col">
        {/* Top header */}
        <header className="relative bg-white border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 flex items-center gap-3 sticky top-0 z-30">
          {/* Green top accent */}
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-500 to-green-700" />

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="md:hidden w-9 h-9 grid place-items-center rounded-lg text-slate-600 hover:bg-slate-100 transition"
            title="Open menu"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <h2 className="text-base md:text-lg font-semibold text-green-800 capitalize">
            {page}
          </h2>
        </header>

        <div className="p-4 md:p-6 flex-1">
          {page === "employees" ? <EmployeesPage /> : <SchedulerPage />}
        </div>
      </main>
    </div>
  );
}