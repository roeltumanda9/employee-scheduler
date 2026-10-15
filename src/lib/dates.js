export function getDaysInMonth(year, month) {
  // month: 1–12
  const days = [];
  const total = new Date(year, month, 0).getDate();

  for (let d = 1; d <= total; d++) {
    days.push({
      day: d,
      iso: `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      weekday: new Date(year, month - 1, d).toLocaleDateString("en-US", {
        weekday: "short",
      }),
    });
  }

  return days;
}
/**
 * Returns the days for a payroll period.
 * @param {number} year   Anchor year (the month the period ends in)
 * @param {number} month  1-12 (the month the period ends in)
 * @param {1|2}    period 1 = prev 27 → this 11
 *                        2 = this 12 → this 26
 */
export function getPayrollPeriodDays(year, month, period) {
  let start, end;

  if (period === 1) {
    // Start = 27th of the previous month
    let pM = month - 1;
    let pY = year;
    if (pM < 1) { pM = 12; pY -= 1; }
    start = new Date(pY, pM - 1, 27);
    // End = 11th of the current month
    end = new Date(year, month - 1, 11);
  } else {
    // 2nd period: 12 → 26 of the current month
    start = new Date(year, month - 1, 12);
    end = new Date(year, month - 1, 26);
  }

  const days = [];
  const cur = new Date(start);
  while (cur <= end) {
    const y = cur.getFullYear();
    const m = cur.getMonth() + 1;
    const d = cur.getDate();
    days.push({
      day: d,
      iso: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
      weekday: cur.toLocaleDateString("en-US", { weekday: "short" }),
    });
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}