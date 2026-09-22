// Display helpers for entries (plain script, exposes globals).

const formatHours = (hours) => `${hours}h`;

// A date key ("YYYY-MM-DD", what dates are stored and sent as) as shown to people: "DD-MM-YYYY".
const formatDate = (key) => key.split("-").reverse().join("-");

// "2.5h · Acme Corp - Website Redesign". Hours come first so they stay visible
// when a long project name is cut off with an ellipsis in a day cell.
const formatEntry = (entry) => `${formatHours(entry.hours)} · ${entry.project}`;
