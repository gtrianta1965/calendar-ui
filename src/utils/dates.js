// Date helpers and calendar constants (plain script, exposes globals).

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]; // the week starts on Monday
const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

const pad2 = (n) => String(n).padStart(2, "0");

// month is 0-based, like Date. Returns "YYYY-MM-DD".
const dateKey = (year, month, day) => `${year}-${pad2(month + 1)}-${pad2(day)}`;

const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();

// 0 (Monday) - 6 (Sunday). Date.getDay() is 0 (Sunday) - 6 (Saturday), so shift it by one.
const firstWeekday = (year, month) => (new Date(year, month, 1).getDay() + 6) % 7;

// Every cell of the month view: leading days from the previous month and trailing
// days from the next one fill out the first and last weeks (always whole weeks).
// Returns [{ key, day, month, outside }], where `month` is 0-based and `outside`
// is true for days that belong to the previous or next month.
function monthGrid(year, month) {
  const lead = firstWeekday(year, month);
  const total = Math.ceil((lead + daysInMonth(year, month)) / 7) * 7;
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(year, month, 1 - lead + i); // Date rolls over month/year boundaries
    return {
      key: dateKey(d.getFullYear(), d.getMonth(), d.getDate()),
      day: d.getDate(),
      month: d.getMonth(),
      outside: d.getMonth() !== month,
    };
  });
}
