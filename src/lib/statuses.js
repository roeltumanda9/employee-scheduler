// Every shift the app knows about.
export const STATUSES = [
  // DUTY — varies per department
  {
    code: "DUTY",
    label: "Duty",
    time: "10:00 AM – 7:00 PM",
    timeByDepartment: {
      Amysthetic: "10:00 AM – 7:00 PM",
      Wellness: "8:00 AM – 5:00 PM",
      Johanju: "9:00 AM – 6:00 PM",
      HMC: "8:00 AM – 5:00 PM",
      "HMC Laboratory": "8:00 AM – 5:00 PM",
    },
    classes: "bg-sky-500 text-white",
  },

 // H Hotel
{
  code: "AM",
  label: "AM Shift",
  time: "6:00 AM – 2:00 PM",
  classes: "bg-blue-500 text-white",
},
{
  code: "PM",
  label: "PM Shift",
  time: "2:00 PM – 10:00 PM",
  classes: "bg-amber-500 text-white",
},
{
  code: "MS",
  label: "Morning Shift",
  time: "6:00 AM – 6:00 PM",
  classes: "bg-emerald-500 text-white",
},
{
  code: "NS",
  label: "Night Shift",
  time: "6:00 PM – 6:00 AM",
  classes: "bg-indigo-500 text-white",
},
{
  code: "G",
  label: "Graveyard Shift",
  time: "10:00 PM – 6:00 AM",
  classes: "bg-slate-700 text-white",
},
{
  code: "9-6",
  label: "9-6 Shift",
  time: "9:00 AM – 6:00 PM",
  classes: "bg-orange-500 text-white",
},

  // Grocery / Pharmacy
  {
    code: "AS",
    label: "Afternoon Shift",
    time: "2:00 PM – 10:00 PM",
    classes: "bg-rose-500 text-white",
  },

  // Hofitea
  {
    code: "RS",
    label: "Regular Shift",
    time: "8:00 AM – 5:00 PM",
    classes: "bg-cyan-500 text-white",
  },
  {
    code: "LS",
    label: "Late Shift",
    time: "11:00 AM – 8:00 PM",
    classes: "bg-violet-500 text-white",
  },
  {
    code: "ES",
    label: "Extended Shift",
    time: "8:00 AM – 8:00 PM",
    classes: "bg-fuchsia-500 text-white",
  },

  // Off
  {
    code: "OFF",
    label: "Day Off",
    time: "",
    classes: "bg-slate-300 text-slate-700",
  },
];

export const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.code, s]));

export const STATUSES_BY_DEPARTMENT = {
  Amysthetic: ["DUTY", "OFF"],
  "H Hotel": ["AM", "PM", "MS", "NS", "G", "9-6", "OFF"],
  "JA Grocery / Pharmacy": ["AM", "PM", "OFF"],
  Wellness: ["DUTY", "OFF"],
  Johanju: ["DUTY", "OFF"],
  HMC: ["DUTY", "AS", "OFF"],
  "HMC Laboratory": ["DUTY", "OFF"],
  Hofitea: ["RS", "LS", "ES", "OFF"],
};

export function statusesForDepartment(department) {
  const codes = STATUSES_BY_DEPARTMENT[department] || ["OFF"];
  return codes.map((code) => STATUS_MAP[code]).filter(Boolean);
}

export function resolveStatus(status, department) {
  if (!status) return status;
  if (status.timeByDepartment && status.timeByDepartment[department]) {
    return { ...status, time: status.timeByDepartment[department] };
  }
  return status;
}

export function statusesForDepartmentResolved(department) {
  const codes = STATUSES_BY_DEPARTMENT[department] || ["OFF"];
  return codes
    .map((code) => resolveStatus(STATUS_MAP[code], department))
    .filter(Boolean);
}