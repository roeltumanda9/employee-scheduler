import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { getDaysInMonth } from "../lib/dates";
import { DEPARTMENTS } from "../lib/departments";
import ScheduleGrid from "../components/ScheduleGrid";
import { STATUS_MAP, STATUSES_BY_DEPARTMENT, resolveStatus } from "../lib/statuses";


const DEPT_BANNERS = {
  "Amysthetic":          "/logo-banner-amystethic.png",
  "H Hotel":             "/logo-banner-hhotel.png",
  "JA Grocery / Pharmacy":  "/logo-banner-jagrocery.png",
  "Wellness":            "/logo-banner-wellness.png",
  "johanju":             "/logo-banner-johanju.png",
  "HMC":                 "/logo-banner.png",
  "HMC Laboratory":      "/logo-banner.png",
  "Hofitea":             "/logo-banner-hofitea.png",
};

const DEFAULT_BANNER = "/logo-banner.png";

function bannerFor(deptLabel, isAll) {
  if (isAll) return DEFAULT_BANNER;
  return DEPT_BANNERS[deptLabel] || DEFAULT_BANNER;
}

export default function SchedulerPage({ role }) {
  const canEdit = role === "super_admin" || role === "admin";

  const today = new Date();
  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1; // 1-12

  // --- 3-month window: previous, current, next ---
  function monthOffset(delta) {
    let m = todayMonth + delta;
    let y = todayYear;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    return { year: y, month: m };
  }

  const PREV = monthOffset(-1);
  const NEXT = monthOffset(1);

  function isAllowed(y, m) {
    const key = y * 100 + m;
    return (
      key >= PREV.year * 100 + PREV.month &&
      key <= NEXT.year * 100 + NEXT.month
    );
  }

  // --- State ---
  const [month, setMonth] = useState(() => {
    const savedM = parseInt(localStorage.getItem("hmc_sched_month"), 10);
    const savedY = parseInt(localStorage.getItem("hmc_sched_year"), 10);
    if (
      savedM >= 1 && savedM <= 12 &&
      savedY >= 2000 && savedY <= 2100 &&
      isAllowed(savedY, savedM)
    ) {
      return savedM;
    }
    return todayMonth;
  });

  const [year, setYear] = useState(() => {
    const savedM = parseInt(localStorage.getItem("hmc_sched_month"), 10);
    const savedY = parseInt(localStorage.getItem("hmc_sched_year"), 10);
    if (
      savedM >= 1 && savedM <= 12 &&
      savedY >= 2000 && savedY <= 2100 &&
      isAllowed(savedY, savedM)
    ) {
      return savedY;
    }
    return todayYear;
  });

  const [half, setHalf] = useState(() => {
    const v = parseInt(localStorage.getItem("hmc_sched_half"), 10);
    return v === 2 ? 2 : 1;
  });

  const [dept, setDept] = useState(() => {
    const v = localStorage.getItem("hmc_sched_dept");
    return v || "all";
  });

  const [employees, setEmployees] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);

  const allDays = useMemo(() => getDaysInMonth(year, month), [year, month]);

  const days = useMemo(() => {
    if (half === 1) return allDays.filter((d) => d.day <= 15);
    return allDays.filter((d) => d.day > 15);
  }, [allDays, half]);

  const lastDay = allDays.length ? allDays[allDays.length - 1].day : 30;
  const months = [
    "January","February","March","April","May","June",
    "July","August","September","October","November","December",
  ];

  const isAllDepts = dept === "all";

  const visibleEmployees = useMemo(() => {
    if (isAllDepts) return employees;
    return employees.filter((e) => e.department === dept);
  }, [employees, dept, isAllDepts]);

  async function load() {
    setLoading(true);
    const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const monthEnd = `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;

    const [empRes, schRes] = await Promise.all([
      supabase.from("employees").select("*").order("name"),
      supabase
        .from("schedules")
        .select("*")
        .gte("date", monthStart)
        .lt("date", monthEnd),
    ]);

    if (empRes.error) alert(empRes.error.message);
    else setEmployees(empRes.data);

    if (schRes.error) alert(schRes.error.message);
    else setSchedules(schRes.data);

    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, [month, year]);

  useEffect(() => {
    localStorage.setItem("hmc_sched_month", String(month));
    localStorage.setItem("hmc_sched_year", String(year));
    localStorage.setItem("hmc_sched_half", String(half));
    localStorage.setItem("hmc_sched_dept", dept);
  }, [month, year, half, dept]);

  async function setStatus(employeeId, iso, status) {
    if (isAllDepts || !canEdit) return;

    const existing = schedules.find(
      (s) => s.employee_id === employeeId && s.date === iso
    );

    if (!status) {
      if (!existing) return;
      const { error } = await supabase
        .from("schedules")
        .delete()
        .eq("id", existing.id);
      if (error) return alert(error.message);
      setSchedules((prev) => prev.filter((s) => s.id !== existing.id));
      return;
    }

    if (existing) {
      const { data, error } = await supabase
        .from("schedules")
        .update({ status })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) return alert(error.message);
      setSchedules((prev) =>
        prev.map((s) => (s.id === existing.id ? data : s))
      );
      return;
    }

    const { data, error } = await supabase
      .from("schedules")
      .insert({ employee_id: employeeId, date: iso, status })
      .select()
      .single();
    if (error) return alert(error.message);
    setSchedules((prev) => [...prev, data]);
  }

  async function clearHalf() {
    if (isAllDepts || !canEdit) return;

    const empIds = visibleEmployees.map((e) => e.id);
    if (empIds.length === 0 || days.length === 0) return;

    const ok = window.confirm(
      `Clear all shifts for ${dept} on ${months[month - 1]} ${
        half === 1 ? "1–15" : `16–${lastDay}`
      }?\n\nThis cannot be undone.`
    );
    if (!ok) return;

    const firstIso = days[0].iso;
    const lastIso = days[days.length - 1].iso;

    const { error } = await supabase
      .from("schedules")
      .delete()
      .in("employee_id", empIds)
      .gte("date", firstIso)
      .lte("date", lastIso);

    if (error) return alert(error.message);

    const empIdSet = new Set(empIds);
    const daySet = new Set(days.map((d) => d.iso));
    setSchedules((prev) =>
      prev.filter(
        (s) => !(empIdSet.has(s.employee_id) && daySet.has(s.date))
      )
    );
  }

  function changeMonth(delta) {
    let m = month + delta;
    let y = year;
    if (m < 1) { m = 12; y -= 1; }
    if (m > 12) { m = 1; y += 1; }
    if (!isAllowed(y, m)) return;
    setMonth(m);
    setYear(y);
  }

  function canGoPrev() {
    const current = year * 100 + month;
    return current > PREV.year * 100 + PREV.month;
  }

  function canGoNext() {
    const current = year * 100 + month;
    return current < NEXT.year * 100 + NEXT.month;
  }

  /* ---------------- PRINT ---------------- */
  function handlePrint() {
    const deptLabel = isAllDepts ? "All Departments" : dept;

    const lookup = {};
    for (const s of schedules) {
      lookup[`${s.employee_id}|${s.date}`] = s.status;
    }

    const dayHeaders = days
      .map(
        (d) => `
        <th class="day">
          <div class="weekday">${d.weekday.toUpperCase()}</div>
          <div class="daynum">${d.day}</div>
        </th>`
      )
      .join("");

    let grandPresent = 0;
    let grandOff = 0;
    let grandTotalDays = 0;

    const rows = visibleEmployees
      .map((emp, i) => {
        let present = 0;
        let off = 0;

        const cells = days
          .map((d) => {
            const st = lookup[`${emp.id}|${d.iso}`];
            if (st && st !== "OFF") present++;
else if (st === "OFF") off++;

            let cls = "cell";
if (st) cls += ` cell-${st.toLowerCase()}`;

            return `<td class="${cls}">${st || ""}</td>`;
          })
          .join("");

        const total = present;
        grandPresent += present;
        grandOff += off;
        grandTotalDays += total;

        return `
          <tr>
            <td class="num">${i + 1}</td>
            <td class="name">
              <div class="ename">${emp.name}</div>
              <div class="role">${emp.role}</div>
            </td>
            ${cells}
            <td class="cell sum present">${present || ""}</td>
            <td class="cell sum off">${off || ""}</td>
            <td class="cell sum total">${total || ""}</td>
          </tr>`;
      })
      .join("");

    const dailyTotals = days
      .map((d) => {
        let count = 0;
        for (const emp of visibleEmployees) {
          const st = lookup[`${emp.id}|${d.iso}`];
          if (st && st !== "OFF") count++;
        }
        return `<td class="cell total">${count}</td>`;
      })
      .join("");

    const halfLabel =
      half === 1 ? "1st Half (1–15)" : `2nd Half (16–${lastDay})`;

      // Build a legend of the shifts actually used in this printed view.
// Only shows shifts that appear at least once, so the legend stays clean.
const usedCodes = new Set();
for (const s of schedules) {
  if (!halfDaySet.has(s.date)) continue;
  if (!visibleIds.has(s.employee_id)) continue;
  if (s.status) usedCodes.add(s.status);
}

// For "All departments" the shifts may differ per dept, so always include
// the ones visible. If a specific department is selected, use its allowed
// shifts + OFF.
const legendCodes = isAllDepts
  ? Array.from(usedCodes)
  : (() => {
      const codes = STATUSES_BY_DEPARTMENT[dept] || [];
      return Array.from(new Set([...codes, "OFF"]));
    })();

const legendItems = legendCodes
  .map((code) => resolveStatus(STATUS_MAP[code], dept))
  .filter(Boolean);

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Schedule — ${deptLabel} — ${months[month - 1]} ${year}</title>
  <style>


    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      font-family: "Segoe UI", Arial, sans-serif;
      color: #000;
      background: #fff;
      font-size: 10pt;
    }

    html, body, table, td, th, .header, .infobar, .signatures {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    .page {
      padding: 4mm 5mm;
      width: 100%;
    }

    .header {
      text-align: center;
      margin-bottom: 2mm;
    }
    .header img {
      display: block;
      margin: 0 auto;
      width: 100%;
      max-width: 320mm;
      max-height: 45mm;
      object-fit: contain;
    }

    .infobar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 3mm;
      padding: 2mm 0;
      border-top: 1.5px solid #15803d;
      border-bottom: 1.5px solid #15803d;
    }

    /* ---------- Inline legend in infobar ---------- */
.legend-inline {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 1.5mm 4mm;
  padding: 0 4mm;
  flex: 1;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 1.5mm;
  font-size: 8pt;
}
.legend-code {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 9mm;
  height: 5mm;
  padding: 0 1.5mm;
  border-radius: 1mm;
  font-weight: 800;
  font-size: 7pt;
  color: #111;
  border: 1px solid #cbd5e1;
}
.legend-text {
  color: #111;
  white-space: nowrap;
}
    .month-title {
      font-size: 18pt;
      font-weight: 800;
      letter-spacing: 1px;
      color: #15803d;
      text-transform: uppercase;
      line-height: 1;
    }
    .info-right {
      text-align: right;
      line-height: 1.3;
      font-size: 9.5pt;
    }
    .info-right .line1 {
      font-weight: 700;
      font-size: 10pt;
    }
    .info-right .line2 {
      font-size: 9pt;
      font-weight: 700;
    }
    .info-right strong { color: #15803d; font-weight: 800; }
    .info-right .line2 strong { color: #111; }
    .info-right .line2 .value { color: #15803d; font-weight: 800; }

    table {
      border-collapse: collapse;
      table-layout: fixed;
      width: 100%;
    }
    th, td {
      border: 1px solid #111;
      text-align: center;
      padding: 1px 0;
      vertical-align: middle;
    }
    thead { display: table-header-group; }
    thead th {
      background: #e8f5e9;
      font-weight: 700;
    }
    th.day { padding: 1px; }
    th.day .weekday {
      font-size: 6.5pt;
      color: #555;
      font-weight: 600;
      letter-spacing: 0.3px;
    }
    th.day .daynum { font-size: 10pt; }

    th.num-h, td.num {
      background: #f1f5f1;
      font-weight: 700;
      font-size: 9pt;
    }
    th.name-h, td.name {
      text-align: left;
      padding-left: 5px;
      background: #fafdfa;
    }
    .ename {
      font-weight: 700;
      font-size: 9pt;
      line-height: 1.15;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .role {
      font-size: 7.5pt;
      color: #555;
      line-height: 1.1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    td.cell {
      height: 20px;
      min-height: 20px;
      font-weight: 700;
      font-size: 9pt;
      background: #fff;
      color: #111;
    }
    td.cell.cell-duty { background: #7dd3fc !important; color: #0c4a6e !important; }
td.cell.cell-ns   { background: #a5b4fc !important; color: #1e1b4b !important; }
td.cell.cell-ds   { background: #fcd34d !important; color: #78350f !important; }
td.cell.cell-eds  { background: #fdba74 !important; color: #7c2d12 !important; }
td.cell.cell-gs   { background: #cbd5e1 !important; color: #0f172a !important; }
td.cell.cell-ms   { background: #86efac !important; color: #14532d !important; }
td.cell.cell-as   { background: #fda4af !important; color: #881337 !important; }
td.cell.cell-rs   { background: #67e8f9 !important; color: #164e63 !important; }
td.cell.cell-ls   { background: #c4b5fd !important; color: #3b0764 !important; }
td.cell.cell-es   { background: #f0abfc !important; color: #581c87 !important; }
td.cell.cell-off  { background: #e2e8f0 !important; color: #334155 !important; }
td.cell.total { background: #e8f5e9 !important; color: #166534 !important; }

/* Legend chips — same colors as cells */
.legend-code.cell-duty { background: #7dd3fc !important; color: #0c4a6e !important; }
.legend-code.cell-ns   { background: #a5b4fc !important; color: #1e1b4b !important; }
.legend-code.cell-ds   { background: #fcd34d !important; color: #78350f !important; }
.legend-code.cell-eds  { background: #fdba74 !important; color: #7c2d12 !important; }
.legend-code.cell-gs   { background: #cbd5e1 !important; color: #0f172a !important; }
.legend-code.cell-ms   { background: #86efac !important; color: #14532d !important; }
.legend-code.cell-as   { background: #fda4af !important; color: #881337 !important; }
.legend-code.cell-rs   { background: #67e8f9 !important; color: #164e63 !important; }
.legend-code.cell-ls   { background: #c4b5fd !important; color: #3b0764 !important; }
.legend-code.cell-es   { background: #f0abfc !important; color: #581c87 !important; }
.legend-code.cell-off  { background: #e2e8f0 !important; color: #334155 !important; }

    th.sum-h {
      font-weight: 800;
      font-size: 7pt;
      padding: 2px 2px;
      white-space: normal;
      line-height: 1.05;
      word-break: break-word;
    }
    td.sum {
      font-weight: 800;
      font-size: 9pt;
      padding: 1px 2px;
    }
    th.sum-h.present-h { background: #dcfce7 !important; color: #166534 !important; }
    th.sum-h.off-h     { background: #ffe4e6 !important; color: #be123c !important; }
    th.sum-h.total-h   { background: #e2e8f0 !important; color: #1e293b !important; }

    td.sum.present { background: #f0fdf4 !important; color: #166534 !important; }
    td.sum.off     { background: #fff1f2 !important; color: #be123c !important; }
    td.sum.total   { background: #f1f5f9 !important; color: #1e293b !important; }

    tfoot { display: table-row-group; }
    tfoot td {
      background: #e8f5e9 !important;
      font-weight: 700;
      padding: 3px 2px;
    }
    tfoot td.num, tfoot td.name {
      text-align: right;
      font-size: 8.5pt;
      letter-spacing: 0.4px;
    }
    tfoot td.sum { background: #d1fae5 !important; font-weight: 800; }
    tfoot td.sum.off { background: #ffe4e6 !important; }
    tfoot td.sum.total { background: #e2e8f0 !important; }

    tr { page-break-inside: avoid; }
    /* ---------- Shift Legend ---------- */
    .legend {
      margin-top: 4mm;
      padding: 2mm 3mm;
      border: 1px solid #333;
      border-radius: 3px;
      background: #f8fafc;
      page-break-inside: avoid;
    }
    .legend-title {
      font-size: 8pt;
      font-weight: 800;
      letter-spacing: 1px;
      color: #15803d;
      text-transform: uppercase;
      margin-bottom: 1.5mm;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 1mm;
    }
    .legend-items {
      display: flex;
      flex-wrap: wrap;
      gap: 3mm 6mm;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 2mm;
      font-size: 6.5pt;
    }
    .legend-code {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 8mm;
      height: 4mm;
      padding: 0 1.5mm;
      border-radius: 1mm;
      font-weight: 800;
      font-size: 6pt;
      color: #111;
      border: 1px solid #cbd5e1;
    }
    .legend-text {
      color: #111;
      font-size: 7.5pt;
    }
    .legend-text strong {
      font-weight: 700;
    }

    /* ---------- Shift Legend (inside thead) ---------- */
.legend-row td.legend-cell {
  padding: 2mm 3mm;
  background: #f8fafc;
  border: 1px solid #111;
  border-bottom: 2px solid #15803d;
}
.legend {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 2mm 5mm;
  text-align: left;
}
.legend-title {
  font-size: 8pt;
  font-weight: 800;
  letter-spacing: 1px;
  color: #15803d;
  text-transform: uppercase;
  margin-right: 2mm;
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 1.5mm;
  font-size: 7.5pt;
}
.legend-code {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 10mm;
  height: 5mm;
  padding: 0 1.5mm;
  border-radius: 1mm;
  font-weight: 800;
  font-size: 7pt;
  color: #111;
  border: 1px solid #cbd5e1;
}
.legend-text {
  color: #111;
}

    /* ---------- Signatures ---------- */
.signatures {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 12mm;
  margin-top: 6mm;
  page-break-inside: avoid;
}
.sig {
  text-align: left;
}
.sig .label-top {
  font-size: 9pt;
  color: #111;
  margin-bottom: 0;
  white-space: nowrap;
}
.sig .sign-space {
  height: 22px;
}
.sig .name {
  font-weight: 800;
  font-size: 9pt;
  text-transform: uppercase;
  text-decoration: underline;
  text-underline-offset: 2px;
  text-decoration-thickness: 1px;
  color: #111;
  display: block;
  line-height: 1.2;
  white-space: normal;
  word-break: keep-all;
}
.sig .title {
  font-size: 8pt;
  color: #111;
  margin-top: 2px;
  font-weight: 500;
  white-space: nowrap;
}

    @page {
      size: 13in 8.5in;
      margin: 6mm 5mm;
    }
    @media print {
      html, body { background: #fff; }
      .page { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <img src="${bannerFor(deptLabel, isAllDepts)}" alt="${deptLabel}" />
    </div>

        <div class="infobar">
      <div class="month-title">${months[month - 1]} ${year}</div>

      <div class="legend-inline">
        ${legendItems
          .map(
            (s) => `
          <span class="legend-item">
            <span class="legend-code ${
              s.code === "DUTY"
                ? "cell-duty"
                : "cell-" + s.code.toLowerCase()
            }">${s.code}</span>
            <span class="legend-text">
              ${s.label}${s.time ? ` — ${s.time}` : ""}
            </span>
          </span>`
          )
          .join("")}
      </div>

      <div class="info-right">
        <div class="line1">Department: <strong>${deptLabel}</strong></div>
        <div class="line2">
          <strong>Period:</strong> <span class="value">${halfLabel}</span>
          &nbsp;•&nbsp;
          <strong>Employees:</strong> <span class="value">${visibleEmployees.length}</span>
        </div>
      </div>
    </div>

    <table>
      <colgroup>
        <col style="width:3.5%" />
        <col style="width:15%" />
        ${days.map(() => `<col style="width:3.2%" />`).join("")}
        <col style="width:7%" />
        <col style="width:7%" />
        <col style="width:7%" />
      </colgroup>
             <thead>
        <tr>
          <th class="num-h">#</th>
          <th class="name-h">NAME</th>
          ${dayHeaders}
          <th class="sum-h present-h">PHYSICAL<br>PRESENT</th>
          <th class="sum-h off-h">PHYSICAL<br>OFF</th>
          <th class="sum-h total-h">TOTAL<br>WORKING<br>DAYS</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
      <tfoot>
        <tr>
          <td class="num"></td>
          <td class="name">TOTAL MANPOWER</td>
          ${dailyTotals}
          <td class="sum present">${grandPresent}</td>
          <td class="sum off">${grandOff}</td>
          <td class="sum total">${grandTotalDays}</td>
        </tr>
      </tfoot>
    </table>

    </tfoot>
    </table>


        <div class="signatures">
      <div class="sig">
        <div class="label-top">Prepared by:</div>
        <div class="sign-space"></div>
        <div class="name">LORRAINE JANE L. DUNKEN</div>
        <div class="title">OIC-Manager</div>
      </div>
      <div class="sig">
        <div class="label-top">Checked by:</div>
        <div class="sign-space"></div>
        <div class="name">VALERIE MARIE CALLENERO</div>
        <div class="title">Human Resource Manager</div>
      </div>
      <div class="sig">
        <div class="label-top">Approved by:</div>
        <div class="sign-space"></div>
        <div class="name">JOSE F. HOFILEÑA III, MD, MBA</div>
        <div class="title">Medical Director</div>
      </div>
    </div>

  </div>
</body>
</html>`;

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.left = "-10000px";
    iframe.style.top = "0";
    iframe.style.width = "1250px";
    iframe.style.height = "820px";
    iframe.style.border = "0";
    iframe.setAttribute("aria-hidden", "true");
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    const waitForImages = () =>
      Promise.all(
        Array.from(doc.images).map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise((res) => {
                img.onload = res;
                img.onerror = res;
              })
        )
      );

    const ready = () => {
      waitForImages().then(() => {
        setTimeout(() => {
          try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
          } catch (e) {
            console.error("Print failed:", e);
            alert("Print failed. Please try again.");
          }
          setTimeout(() => {
            if (document.body.contains(iframe)) {
              document.body.removeChild(iframe);
            }
          }, 2000);
        }, 300);
      });
    };

    if (doc.readyState === "complete") ready();
    else {
      iframe.onload = ready;
      setTimeout(ready, 800);
    }
  }

  const visibleIds = useMemo(
    () => new Set(visibleEmployees.map((e) => e.id)),
    [visibleEmployees]
  );
  const halfDaySet = new Set(days.map((d) => d.iso));
  const stats = { AM: 0, PM: 0, D: 0, OFF: 0 };
  for (const s of schedules) {
    if (!halfDaySet.has(s.date)) continue;
    if (!visibleIds.has(s.employee_id)) continue;
    if (stats[s.status] !== undefined) stats[s.status]++;
  }
  const totalCells = visibleEmployees.length * days.length;
  const filledCells = stats.AM + stats.PM + stats.D + stats.OFF;
  const emptyCells = totalCells - filledCells;

  // Is the currently viewed month the current calendar month?
  const isCurrentMonth = month === todayMonth && year === todayYear;
  const isPrevMonth =
    !isCurrentMonth &&
    (year * 100 + month) < (todayYear * 100 + todayMonth);
  const isNextMonth =
    !isCurrentMonth &&
    (year * 100 + month) > (todayYear * 100 + todayMonth);

  return (
    <div className="space-y-5">
      <div className="sticky top-0 z-30 -mx-4 md:-mx-6 px-4 md:px-6 pt-2 pb-3 bg-slate-100/80 backdrop-blur border-b border-slate-200">
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-4 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              disabled={!canGoPrev()}
              className="w-9 h-9 grid place-items-center rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              title={canGoPrev() ? "Previous month" : "No earlier months available"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="min-w-[160px] text-center">
              <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                {isCurrentMonth
                  ? "Current Month"
                  : isPrevMonth
                  ? "Previous Month"
                  : "Next Month"}
              </div>
              <div className="text-base font-bold text-slate-800">
                {months[month - 1]} {year}
              </div>
            </div>
            <button
              onClick={() => changeMonth(1)}
              disabled={!canGoNext()}
              className="w-9 h-9 grid place-items-center rounded-lg text-slate-600 hover:bg-slate-100 active:scale-95 transition disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              title={canGoNext() ? "Next month" : "No later months available"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="hidden md:block h-8 w-px bg-slate-200" />

          <DepartmentDropdown value={dept} onChange={setDept} />

          {canEdit && (
            <button
              onClick={clearHalf}
              disabled={isAllDepts || visibleEmployees.length === 0}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-rose-200 text-rose-600 bg-white hover:bg-rose-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
              title={isAllDepts ? "Not available in preview mode" : "Clear this half"}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6" />
                <path d="M14 11v6" />
              </svg>
              Clear
            </button>
          )}

          <button
            onClick={handlePrint}
            disabled={visibleEmployees.length === 0}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-xl border border-green-200 text-green-700 bg-white hover:bg-green-50 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition"
            title="Print this schedule"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            Print
          </button>

          <div className="hidden md:block h-8 w-px bg-slate-200" />

          <div className="inline-flex rounded-xl bg-slate-100 p-1">
            <button
              onClick={() => setHalf(1)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                half === 1
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              1st · 1–15
            </button>
            <button
              onClick={() => setHalf(2)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition ${
                half === 2
                  ? "bg-white text-green-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              2nd · 16–{lastDay}
            </button>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {(isAllDepts || !canEdit) && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-green-700 bg-green-50 ring-1 ring-green-100 rounded-full px-2.5 py-1">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Preview only
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Employees" value={visibleEmployees.length} />
      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 px-1">
  <span className="font-medium text-slate-500">
    Shifts shown in each cell depend on the employee's department.
  </span>
  <LegendChip color="bg-slate-300" label="OFF" />
  <LegendChip color="bg-white ring-1 ring-slate-300" label="Unassigned" />
</div>

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-12 text-center">
          <div className="inline-block w-6 h-6 border-2 border-slate-300 border-t-green-600 rounded-full animate-spin" />
          <p className="mt-3 text-sm text-slate-500">Loading schedule…</p>
        </div>
      ) : visibleEmployees.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-12 text-center">
          <div className="text-4xl">👥</div>
          <p className="mt-3 text-sm font-medium text-slate-700">
            No employees in {isAllDepts ? "any department" : dept}
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Add employees first, then come back to schedule them.
          </p>
        </div>
      ) : (
        <ScheduleGrid
          employees={visibleEmployees}
          days={days}
          schedules={schedules}
          onSetStatus={setStatus}
          readOnly={isAllDepts || !canEdit}
        />
      )}
    </div>
  );
}

/* ------------------ Department dropdown ------------------ */
function DepartmentDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    function onKey(e) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const isAll = value === "all";
  const label = isAll ? "All departments" : value;

  const options = [
    { value: "all", label: "All departments", preview: true },
    ...[...DEPARTMENTS]
      .sort((a, b) => a.localeCompare(b))
      .map((d) => ({ value: d, label: d, preview: false })),
  ];

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition min-w-[200px] justify-between ${
          open
            ? "border-green-500 ring-2 ring-green-100 bg-white"
            : "border-slate-200 bg-slate-50/60 hover:bg-white"
        }`}
      >
        <span className="flex items-center gap-2 min-w-0">
          <svg
            className={isAll ? "text-green-600" : "text-slate-400"}
            width="14" height="14" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            strokeLinecap="round" strokeLinejoin="round"
          >
            <path d="M3 21h18" />
            <path d="M5 21V7l7-4 7 4v14" />
            <path d="M9 21v-6h6v6" />
          </svg>
          <span className={`truncate ${isAll ? "text-green-700 font-semibold" : "text-slate-800"}`}>
            {label}
          </span>
          {isAll && (
            <span className="text-[10px] uppercase tracking-wider font-bold text-green-700 bg-green-50 ring-1 ring-green-100 rounded-full px-1.5 py-0.5 shrink-0">
              Preview
            </span>
          )}
        </span>

        <svg
          className={`text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-40 top-full left-0 mt-2 w-72 bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-1.5">
          <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
            Select department
          </div>

          {options.map((opt) => {
            const active = value === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left transition ${
                  active
                    ? "bg-green-50 text-green-800"
                    : "hover:bg-slate-50 text-slate-700"
                }`}
              >
                <span className="flex-1 truncate font-medium">{opt.label}</span>

                {opt.preview && (
                  <span className="text-[10px] uppercase tracking-wider font-bold text-green-700 bg-green-50 ring-1 ring-green-100 rounded-full px-1.5 py-0.5 shrink-0">
                    Preview
                  </span>
                )}

                {active && (
                  <svg
                    className="text-green-600 shrink-0"
                    width="16" height="16" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm ring-1 ring-slate-200 p-4">
      <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
        {label}
      </div>
      <div className="mt-1">
        <div className="text-2xl font-bold text-slate-800">{value}</div>
      </div>
    </div>
  );
}

function LegendChip({ color, label }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-3.5 h-3.5 rounded ${color}`} />
      {label}
    </span>
  );
}