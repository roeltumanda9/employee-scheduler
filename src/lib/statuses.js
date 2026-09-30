// Every shift the app knows about.
// `code`   — short code shown in cells (e.g. "NS")
// `label`  — full name (used in tooltips / popup)
// `time`   — the time range (shown in the popup next to the label)
// `classes`— Tailwind colors for the chip
export const STATUSES = [
  // DUTY — varies per department, but code stays the same
  {
  code: "DUTY",
  label: "Duty",
  time: "10:00 AM – 7:00 PM",   // default (Amysthetic)
  timeByDepartment: {
    "Amysthetic":     "10:00 AM – 7:00 PM",
    "Wellness":       "8:00 AM – 5:00 PM",
    "johanju":        "9:00 AM – 6:00 PM",
    "HMC":            "8:00 AM – 5:00 PM",
    "HMC Laboratory": "8:00 AM – 5:00 PM",
  },
  classes: "bg-sky-500 text-white",
},

  // H Hotel
  { code: "NS",  label: "Night Shift",         time: "6:00 PM – 3:00 AM", classes: "bg-indigo-500 text-white" },
  { code: "DS",  label: "Day Shift",           time: "8:00 AM – 5:00 PM", classes: "bg-amber-500 text-white" },
  { code: "EDS", label: "Extended Day Shift",  time: "6:00 AM – 6:00 PM", classes: "bg-orange-500 text-white" },
  { code: "GS",  label: "Graveyard Shift",     time: "6:00 PM – 6:00 AM", classes: "bg-slate-700 text-white" },

  // Grocery / Pharmacy
  { code: "MS",  label: "Morning Shift",       time: "6:00 AM – 2:00 PM", classes: "bg-emerald-500 text-white" },
  { code: "AS",  label: "Afternoon Shift",     time: "2:00 PM – 10:00 PM", classes: "bg-rose-500 text-white" },

  // Hofitea
  { code: "RS",  label: "Regular Shift",       time: "8:00 AM – 5:00 PM", classes: "bg-cyan-500 text-white" },
  { code: "LS",  label: "Late Shift",          time: "11:00 AM – 8:00 PM", classes: "bg-violet-500 text-white" },
  { code: "ES",  label: "Extended Shift",      time: "8:00 AM – 8:00 PM", classes: "bg-fuchsia-500 text-white" },

  // Off — available to everyone
  { code: "OFF", label: "Day Off",             time: "",                   classes: "bg-slate-300 text-slate-700" },
];

export const STATUS_MAP = Object.fromEntries(
  STATUSES.map((s) => [s.code, s])
);

// Which shift codes are available per department.
// Every department also gets "OFF".
export const STATUSES_BY_DEPARTMENT = {
  "Amysthetic":         ["DUTY", "OFF"],
  "H Hotel":            ["NS", "DS", "EDS", "GS", "OFF"],
  "Grocery / Pharmacy": ["MS", "AS", "OFF"],
  "Wellness":           ["DUTY", "OFF"],
  "johanju":            ["DUTY", "OFF"],
  "HMC":                ["DUTY", "OFF"],
  "HMC Laboratory":     ["DUTY", "OFF"],
  "Hofitea":            ["RS", "LS", "ES", "OFF"],
};

export function statusesForDepartment(department) {
  const codes = STATUSES_BY_DEPARTMENT[department] || ["OFF"];
  return codes.map((code) => STATUS_MAP[code]).filter(Boolean);
}

// Returns the status object with a `time` that's correct for that department
export function resolveStatus(status, department) {
  if (!status) return status;
  if (status.timeByDepartment && status.timeByDepartment[department]) {
    return { ...status, time: status.timeByDepartment[department] };
  }
  return status;
}

// Get the list of allowed statuses for a department, with times resolved
export function statusesForDepartmentResolved(department) {
  const codes = STATUSES_BY_DEPARTMENT[department] || ["OFF"];
  return codes
    .map((code) => resolveStatus(STATUS_MAP[code], department))
    .filter(Boolean);
}