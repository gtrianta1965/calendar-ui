// One-time move of the entries saved in this browser into the API (plain script, exposes globals).
// Entries used to live only in localStorage (storage.js); this is how they get into the API.

const IMPORT_CHUNK = 500; // the API takes at most 500 entries in one bulk request

const countLocalEntries = () =>
  Object.values(loadEntries()).reduce((n, list) => n + (Array.isArray(list) ? list.length : 0), 0);

// What can be imported right now: { ready: [{ id, payload }], skipped }. An entry needs a project the API still
// offers and an active user; the others are `skipped` and stay in this browser.
// projectIdOf(label) and activeUserIdOf(username) give the API's ids, or undefined.
function planLocalImport({ projectIdOf, activeUserIdOf }) {
  const ready = [];
  let skipped = 0;
  for (const [date, list] of Object.entries(loadEntries())) {
    if (!Array.isArray(list)) continue;
    for (const e of list) {
      const project_id = projectIdOf(e.project);
      const user_id = activeUserIdOf(e.user);
      if (project_id === undefined || user_id === undefined) {
        skipped += 1;
      } else {
        ready.push({ id: e.id, payload: { user_id, project_id, entry_date: date, hours: Number(e.hours) } });
      }
    }
  }
  return { ready, skipped };
}

// Sends the ready entries, each chunk all or none, and removes a chunk from this browser as soon as the API has
// accepted it, so a failure part-way never leads to duplicates. Resolves with how many were imported; rejects
// with the API's error (what was imported before it stays imported).
async function importLocalEntries(plan) {
  let imported = 0;
  for (let i = 0; i < plan.ready.length; i += IMPORT_CHUNK) {
    const chunk = plan.ready.slice(i, i + IMPORT_CHUNK);
    await apiCreateEntries(chunk.map((c) => c.payload));
    const done = new Set(chunk.map((c) => c.id));
    const remaining = {};
    for (const [date, list] of Object.entries(loadEntries())) {
      const kept = list.filter((e) => !done.has(e.id));
      if (kept.length) remaining[date] = kept;
    }
    saveEntries(remaining);
    imported += chunk.length;
  }
  return imported;
}
