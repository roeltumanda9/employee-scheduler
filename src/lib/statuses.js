export const STATUSES = [
  { code: "AM",  label: "AM Shift", classes: "bg-blue-500 text-white" },
  { code: "PM",  label: "PM Shift", classes: "bg-amber-500 text-white" },
  { code: "D",   label: "Duty",     classes: "bg-sky-500 text-white" },
  { code: "OFF", label: "Day Off",  classes: "bg-slate-300 text-slate-700" },
];

export const STATUS_MAP = Object.fromEntries(
  STATUSES.map((s) => [s.code, s])
);

// Which statuses are allowed per department.
// Anything not listed falls back to AM / PM / OFF.
export const STATUSES_BY_DEPARTMENT = {
  "Admin Department": ["D", "OFF"],
};

export function statusesForDepartment(department) {
  const codes = STATUSES_BY_DEPARTMENT[department] || ["AM", "PM", "OFF"];
  return codes.map((code) => STATUS_MAP[code]).filter(Boolean);
}