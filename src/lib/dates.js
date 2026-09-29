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