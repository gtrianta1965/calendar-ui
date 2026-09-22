// The entries saved in this browser (plain script, exposes globals).
//
// Entries now live in the API. What is left here is what was saved before that: it is only read so it can be
// imported into the API once (see importLocal.js), and removed as it is imported.
// Stored shape: { "YYYY-MM-DD": [{ id, user, project, hours }, ...] }
// One store holds every user's entries; each entry carries the `user` who owns it.
//
// Key history: -v1 held free-text comments (ignored, left untouched); -v2 held
// entries without a user (adopted by the first configured user, see adoptLegacyEntries).

const ENTRIES_STORAGE_KEY = "calendar-entries-v3";
const LEGACY_ENTRIES_STORAGE_KEY = "calendar-entries-v2";

function loadEntries() {
  try {
    const data = JSON.parse(localStorage.getItem(ENTRIES_STORAGE_KEY) || "{}");
    return data && typeof data === "object" ? data : {};
  } catch (e) {
    return {};
  }
}

// An empty object removes the key, so clearing all entries leaves no trace.
function saveEntries(entries) {
  try {
    if (Object.keys(entries).length === 0) {
      localStorage.removeItem(ENTRIES_STORAGE_KEY);
    } else {
      localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(entries));
    }
  } catch (e) {
    // Storage unavailable or full: keep working in memory.
  }
}

// One-time migration: entries saved before accounts existed (-v2, no user) are
// moved into the current store and assigned to `user`. The old key is removed
// only after the new data was written, so a failure loses nothing.
function adoptLegacyEntries(user) {
  try {
    const legacy = JSON.parse(localStorage.getItem(LEGACY_ENTRIES_STORAGE_KEY) || "null");
    if (!legacy || typeof legacy !== "object") return;

    const all = loadEntries();
    for (const [date, list] of Object.entries(legacy)) {
      if (!Array.isArray(list) || list.length === 0) continue;
      const adopted = list.map((e) => ({ id: e.id, user, project: e.project, hours: e.hours }));
      all[date] = [...(all[date] || []), ...adopted];
    }
    localStorage.setItem(ENTRIES_STORAGE_KEY, JSON.stringify(all));
    localStorage.removeItem(LEGACY_ENTRIES_STORAGE_KEY);
  } catch (e) {
    // Leave the legacy data where it is.
  }
}
