import { useState, useRef } from "react";
import { STATUSES, STATUS_MAP, statusesForDepartment } from "../lib/statuses";

// Fixed large sizes for readability
const SIZES = {
  empW: 280,
  dayW: 92,
  summaryW: 100,
  cellH: 68,
  cellText: "text-base",
  nameText: "text-lg",
  metaText: "text-sm",
  dayNum: "text-lg",
  dayNumCircle: "w-11 h-11",
  weekday: "text-sm",
  summaryText: "text-lg",
  totalText: "text-lg",
};

export default function ScheduleGrid({
  employees,
  days,
  schedules,
  onSetStatus,
  readOnly = false,
}) {
  const z = SIZES;

  const lookup = {};
  for (const s of schedules) {
    lookup[`${s.employee_id}|${s.date}`] = s;
  }

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const dailyManpower = {};
  for (const d of days) {
    let count = 0;
    for (const emp of employees) {
      const st = lookup[`${emp.id}|${d.iso}`]?.status;
if (st && st !== "OFF") count++;
    }
    dailyManpower[d.iso] = count;
  }

  let grandPresent = 0;
let grandOff = 0;
for (const emp of employees) {
  for (const d of days) {
    const st = lookup[`${emp.id}|${d.iso}`]?.status;
    if (st && st !== "OFF") grandPresent++;
else if (st === "OFF") grandOff++;
  }
}
const grandTotal = grandPresent;  

  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="border-collapse" style={{ minWidth: "100%" }}>
          <colgroup>
            <col style={{ width: z.empW }} />
            {days.map((d) => (
              <col key={d.iso} style={{ width: z.dayW }} />
            ))}
            <col style={{ width: z.summaryW }} />
            <col style={{ width: z.summaryW }} />
            <col style={{ width: z.summaryW }} />
          </colgroup>

          <thead>
            <tr>
              <th className="sticky left-0 z-20 bg-slate-50 border-b border-r border-slate-200 px-3 py-2 text-left">
                <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">
                  Employee
                </span>
              </th>

              {days.map((d) => {
                const isWeekend = d.weekday === "Sat" || d.weekday === "Sun";
                const isToday = d.iso === todayIso;
                return (
                  <th
                    key={d.iso}
                    className={`border-b border-r border-slate-200 px-0.5 py-1.5 text-center ${
                      isWeekend ? "bg-slate-100/70" : "bg-slate-50"
                    }`}
                  >
                    <div
                      className={`${z.weekday} uppercase tracking-wide ${
                        isWeekend ? "text-rose-400" : "text-slate-400"
                      }`}
                    >
                      {d.weekday}
                    </div>
                    <div
                      className={`mx-auto mt-0.5 ${z.dayNumCircle} grid place-items-center rounded-full font-bold ${z.dayNum} ${
                        isToday
                          ? "bg-green-600 text-white shadow"
                          : "text-slate-700"
                      }`}
                    >
                      {d.day}
                    </div>
                  </th>
                );
              })}

              <th className="sticky z-20 bg-emerald-50 border-b border-r border-slate-200 px-1 py-2 text-center">
  <div className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold leading-tight">
    Physical<br />Present
  </div>
</th>
<th className="sticky z-20 bg-rose-50 border-b border-r border-slate-200 px-1 py-2 text-center">
  <div className="text-[10px] uppercase tracking-wider text-rose-700 font-bold leading-tight">
  Physical<br />Off
</div>
</th>
<th className="sticky right-0 z-20 bg-slate-100 border-b border-slate-200 px-1 py-2 text-center">
  <div className="text-[10px] uppercase tracking-wider text-slate-700 font-bold leading-tight">
    Total<br />Working Days
  </div>
</th>
            </tr>
          </thead>

          <tbody>
            {employees.map((emp, idx) => {
              let present = 0;
let off = 0;
for (const d of days) {
  const st = lookup[`${emp.id}|${d.iso}`]?.status;
  if (st && st !== "OFF") present++;
else if (st === "OFF") off++;
}
const total = present; 

              const rowBg = idx % 2 ? "bg-slate-50/40" : "bg-white";
              const hoverBg = readOnly
                ? ""
                : "group-hover:bg-green-50/40";

              return (
                <tr
                  key={emp.id}
                  className={`group ${rowBg} ${
                    readOnly ? "" : "hover:bg-green-50/40"
                  } transition-colors`}
                >
                  <td
                    className={`sticky left-0 z-10 ${rowBg} ${hoverBg} border-b border-r border-slate-200 px-3 py-2 transition-colors`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Row number (display only — not the employee number) */}
                      <div className="w-9 h-9 shrink-0 grid place-items-center rounded-lg bg-green-50 text-green-700 text-sm font-bold tabular-nums ring-1 ring-green-100">
                        {idx + 1}
                      </div>

                      <div className="min-w-0">
                        <div
                          className={`font-semibold ${z.nameText} text-slate-800 truncate leading-tight`}
                        >
                          {emp.name}
                        </div>
                        <div
                          className={`${z.metaText} text-slate-500 truncate leading-tight`}
                        >
                          {emp.role}
                        </div>
                      </div>
                    </div>
                  </td>

                  {days.map((d) => {
                    const key = `${emp.id}|${d.iso}`;
                    const status = lookup[key]?.status;
                    const isToday = d.iso === todayIso;
                    return (
                      <td
                        key={d.iso}
                        className={`border-b border-r border-slate-200 p-0 align-middle ${
                          isToday ? "bg-green-50/40" : ""
                        }`}
                      >
                        <CellButton
  status={status}
  isToday={isToday}
  height={z.cellH}
  textClass={z.cellText}
  readOnly={readOnly}
  statuses={statusesForDepartment(emp.department)}
  onChange={(newStatus) =>
    onSetStatus(emp.id, d.iso, newStatus)
  }
/>
                      </td>
                    );
                  })}

                  <td
                    className={`sticky z-10 ${rowBg} ${hoverBg} border-b border-r border-slate-200 px-1 py-2 text-center transition-colors`}
                  >
                    <SummaryNumber
                      value={present}
                      className={`text-emerald-700 ${z.summaryText}`}
                    />
                  </td>
                  <td
                    className={`sticky z-10 ${rowBg} ${hoverBg} border-b border-r border-slate-200 px-1 py-2 text-center transition-colors`}
                  >
                    <SummaryNumber
                      value={off}
                      className={`text-rose-700 ${z.summaryText}`}
                    />
                  </td>
                  <td
                    className={`sticky right-0 z-10 bg-slate-50 border-b border-slate-200 px-1 py-2 text-center`}
                  >
                    <SummaryNumber
                      value={total}
                      className={`text-slate-800 ${z.summaryText}`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>

          {/* ---------- TOTAL MANPOWER FOOTER ---------- */}
          <tfoot>
            <tr>
              <td className="sticky left-0 z-20 bg-gradient-to-r from-green-100 via-green-50 to-transparent border-t-2 border-green-200 border-r border-slate-200 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-green-600 text-white grid place-items-center shadow-sm">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-green-700 font-bold leading-tight">
                      Total manpower
                    </div>
                    <div className="text-[10px] text-green-600 leading-tight">
                      of the day
                    </div>
                  </div>
                </div>
              </td>

              {days.map((d) => {
                const count = dailyManpower[d.iso] || 0;
                const isToday = d.iso === todayIso;
                return (
                  <td
                    key={d.iso}
                    className={`border-t-2 border-green-200 border-r border-slate-200 py-2 text-center ${
                      isToday ? "bg-green-100" : "bg-green-50/70"
                    }`}
                  >
                    <span
                      className={`font-bold ${z.totalText} ${
                        count > 0 ? "text-green-700" : "text-green-300"
                      }`}
                    >
                      {count}
                    </span>
                  </td>
                );
              })}

              <td className="sticky z-20 bg-emerald-50 border-t-2 border-green-200 border-r border-slate-200 py-2 text-center">
                <span className={`font-bold text-emerald-700 ${z.totalText}`}>
                  {grandPresent}
                </span>
              </td>
              <td className="sticky z-20 bg-rose-50 border-t-2 border-green-200 border-r border-slate-200 py-2 text-center">
                <span className={`font-bold text-rose-700 ${z.totalText}`}>
                  {grandOff}
                </span>
              </td>
              <td className="sticky right-0 z-20 bg-slate-100 border-t-2 border-green-200 py-2 text-center">
                <span className={`font-bold text-slate-700 ${z.totalText}`}>
                  {grandTotal}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ---- Summary cell ---- */
function SummaryNumber({ value, className }) {
  return (
    <span className={`font-bold ${className}`}>
      {value > 0 ? value : "—"}
    </span>
  );
}

/* ---- Cell button (flicker-free popup) ---- */
function CellButton({
  status,
  isToday,
  height,
  textClass,
  readOnly,
  statuses,
  onChange,
}) {
  const [pos, setPos] = useState(null);
  const btnRef = useRef(null);
  const current = status ? STATUS_MAP[status] : null;

  function handleClick() {
    if (readOnly) return;
    if (pos) {
      setPos(null);
      return;
    }

    const r = btnRef.current.getBoundingClientRect();
    const POPUP_W = 208;
    const POPUP_H = 240;

    let left = r.left;
    let top = r.bottom + 6;

    if (left + POPUP_W > window.innerWidth - 8) {
      left = window.innerWidth - POPUP_W - 8;
    }
    if (left < 8) left = 8;

    if (top + POPUP_H > window.innerHeight - 8) {
      top = r.top - POPUP_H - 6;
      if (top < 8) top = 8;
    }

    setPos({ top, left });
  }

  const look = current
    ? `${current.classes} shadow-sm`
    : readOnly
    ? "bg-white text-slate-300"
    : "bg-white text-slate-300 hover:bg-slate-100 hover:text-slate-500";

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleClick}
        disabled={readOnly}
        style={{ height }}
        className={`w-full ${textClass} font-bold tracking-wide transition-all duration-150 ${
          readOnly ? "cursor-default select-none" : "active:scale-95"
        } ${look} ${isToday ? "ring-2 ring-inset ring-green-300" : ""}`}
        title={
          readOnly
            ? current?.label || "Preview only"
            : current?.label || "Click to set"
        }
      >
        {status || "—"}
      </button>

      {!readOnly && pos && (
  <Popup
    pos={pos}
    statuses={statuses}
    onClose={() => setPos(null)}
    onPick={(code) => {
      onChange(code);
      setPos(null);
    }}
  />
)}
    </>
  );
}

/* ---- Popup ---- */
function Popup({ pos, statuses, onClose, onPick }) {
  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 bg-white border border-slate-200 rounded-2xl shadow-2xl p-2 w-72"
        style={{ top: pos.top, left: pos.left }}
      >
        <div className="px-3 py-1.5 text-xs uppercase tracking-wider text-slate-400 font-semibold">
          Set shift
        </div>

        {statuses.map((s) => (
          <button
            key={s.code}
            onClick={() => onPick(s.code)}
            className="w-full flex items-start gap-3 px-3 py-2.5 text-sm rounded-xl hover:bg-slate-100 transition text-left"
          >
            <span
              className={`min-w-[52px] h-9 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 ${s.classes}`}
            >
              {s.code}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-slate-800 font-medium truncate">
                {s.label}
              </span>
              {s.time && (
                <span className="block text-[11px] text-slate-500 mt-0.5">
                  {s.time}
                </span>
              )}
            </span>
          </button>
        ))}

        <div className="my-1.5 border-t border-slate-100" />

        <button
          onClick={() => onPick(null)}
          className="w-full text-left px-3 py-2.5 text-sm rounded-xl hover:bg-rose-50 text-rose-600 font-medium transition"
        >
          Clear
        </button>
      </div>
    </>
  );
}