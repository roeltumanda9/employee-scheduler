export default function PeriodColumn({
  title,
  subtitle,
  period,
  employees,
  schedules,
  onToggle,
}) {
  const assignedIds = new Set(
    schedules.filter((s) => s.period === period).map((s) => s.employee_id)
  );

  return (
    <div className="bg-white rounded-xl shadow overflow-hidden">
      <div className="px-4 py-3 bg-green-50 border-b border-green-100">
        <h2 className="font-semibold text-indigo-900">{title}</h2>
        <p className="text-xs text-green-600">{subtitle}</p>
      </div>

      <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
        {employees.length === 0 && (
          <p className="p-4 text-sm text-slate-500">
            Add employees first.
          </p>
        )}
        {employees.map((e) => {
          const checked = assignedIds.has(e.id);
          return (
            <label
              key={e.id}
              className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition ${
                checked ? "bg-emerald-50" : "hover:bg-slate-50"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(e.id, period)}
                className="w-4 h-4 accent-emerald-600"
              />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-800 truncate">
                  {e.name}{" "}
                  <span className="text-xs text-slate-400 font-normal">
                    #{e.number}
                  </span>
                </p>
                <p className="text-xs text-slate-500 truncate">
                  {e.department} • {e.role}
                </p>
              </div>
            </label>
          );
        })}
      </div>

      <div className="px-4 py-2 bg-slate-50 text-xs text-slate-500 border-t">
        {assignedIds.size} assigned
      </div>
    </div>
  );
}