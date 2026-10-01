// Display helpers for entries (plain script, exposes globals).

const formatHours = (hours) => `${hours}h`;

// A date key ("YYYY-MM-DD", what dates are stored and sent as) as shown to people: "DD-MM-YYYY".
const formatDate = (key) => key.split("-").reverse().join("-");

// A moment from the API (a UTC timestamp such as "2026-09-30T18:24:19Z") in the viewer's own time zone: "DD-MM-YYYY HH:MM".
// Anything that is not a date is returned as it came.
const formatWhen = (iso) => {
  const d = new Date(iso);
  if (isNaN(d)) return iso || "";
  const two = (n) => String(n).padStart(2, "0");
  return `${two(d.getDate())}-${two(d.getMonth() + 1)}-${d.getFullYear()} ${two(d.getHours())}:${two(d.getMinutes())}`;
};

// "2.5h · Acme Corp - Website Redesign". Hours come first so they stay visible
// when a long project name is cut off with an ellipsis in a day cell.
const formatEntry = (entry) => `${formatHours(entry.hours)} · ${entry.project}`;
