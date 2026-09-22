// Tiny display helpers specific to the admin screens (plain script, exposes globals). The main app's own
// src/utils/format.js works on "YYYY-MM-DD" date keys, not the full "YYYY-MM-DDTHH:MM:SSZ" timestamps the
// API returns for created_at, so that one is not reused here.

// "2026-09-20T13:03:55Z" -> "20-09-2026" (the app's own DD-MM-YYYY convention; the time of day rarely matters
// for "when was this created").
const formatTimestamp = (iso) => String(iso).slice(0, 10).split("-").reverse().join("-");
