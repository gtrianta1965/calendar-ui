// State hook for the calendar's entries, kept in the API (plain script, no JSX).
//
// It loads the entries of the chosen users (`userIds`) for the dates on screen (`from` to `to`, the first and last
// cell of the month grid), and loads again when any of those change. It turns changes into API calls. As in the API,
// signing in only says WHO you are: every entry can be added for, edited or deleted by anyone; only "clear all" is
// limited to your own.
//
// An entry, as the components see it: { id, user (username), userId, project (label), projectId, hours, date,
// type ("actual" or "forecast"), note (a string, "" when there is none) }.
// Entries are grouped by date: { "YYYY-MM-DD": [entry, ...] }.
//
// `projectIdOf(label)` and `userIdOf(username)` translate what the form shows into the ids the API wants
// (undefined when unknown). The change functions resolve with { ok: true } or { ok: false, error }, and never throw.

const ENTRIES_LIMIT = 5000; // the most the API returns for one request

const toUiEntry = (e) => ({
  id: e.id,
  user: e.username,
  userId: e.user_id,
  project: e.project_label,
  projectId: e.project_id,
  hours: e.hours,
  date: e.entry_date,
  type: e.entry_type,
  note: e.note || "",
});

// The order the API uses: by user, then by creation.
const byOwnerThenId = (a, b) => a.userId - b.userId || a.id - b.id;

function groupByDate(list) {
  const grouped = {};
  for (const e of list) (grouped[e.date] = grouped[e.date] || []).push(e);
  for (const date of Object.keys(grouped)) grouped[date].sort(byOwnerThenId);
  return grouped;
}

// `entries` without the entry `id` (wherever it is), and with `entry` added when given.
function withEntry(entries, id, entry) {
  const next = {};
  for (const [date, list] of Object.entries(entries)) {
    const kept = list.filter((e) => e.id !== id);
    if (kept.length) next[date] = kept;
  }
  if (entry) next[entry.date] = [...(next[entry.date] || []), entry].sort(byOwnerThenId);
  return next;
}

function useEntries({ from, to, userIds, projectIdOf, userIdOf }) {
  const [state, setState] = React.useState({ entries: {}, status: "loading", error: "", truncated: false });
  const latestRequest = React.useRef(0);

  const usersKey = [...userIds].sort((a, b) => a - b).join(",");   // a value, so a new array with the same ids does not reload

  const load = React.useCallback(async () => {
    const request = ++latestRequest.current;
    if (usersKey === "") {                                         // nobody chosen: nothing to ask for
      setState({ entries: {}, status: "ready", error: "", truncated: false });
      return;
    }
    setState((s) => ({ ...s, status: "loading", error: "" }));
    try {
      const list = await apiEntries(from, to, usersKey.split(","));
      if (request !== latestRequest.current) return; // a newer request has taken over
      setState({ entries: groupByDate(list.map(toUiEntry)), status: "ready", error: "", truncated: list.length >= ENTRIES_LIMIT });
    } catch (e) {
      if (request === latestRequest.current) setState((s) => ({ ...s, status: "error", error: e.message }));
    }
  }, [from, to, usersKey]);

  React.useEffect(() => { load(); }, [load]);

  // Runs an API change; the outcome is a value, so the form can show what went wrong and keep what was typed.
  const attempt = async (change) => {
    try {
      await change();
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  };

  const ownerId = (username) => {
    const id = userIdOf(username);
    if (id === undefined) throw new Error(`Unknown user "${username}".`);
    return id;
  };

  const projectId = (label) => {
    const id = projectIdOf(label);
    if (id === undefined) throw new Error("That project is not available any more. Pick another one.");
    return id;
  };

  // `user` is whose entry it is; left out, it is the signed-in user (the API's default). `note`, trimmed, is left
  // out entirely when blank (the API's own default, no note, rather than sending an empty string it would refuse).
  const addEntry = (date, { project, hours, user: owner, type, note }) => attempt(async () => {
    const body = { project_id: projectId(project), entry_date: date, hours, entry_type: type };
    if (owner) body.user_id = ownerId(owner);
    if (note && note.trim()) body.note = note.trim();
    const created = toUiEntry(await apiCreateEntry(body));
    setState((s) => ({ ...s, entries: withEntry(s.entries, created.id, created) }));
  });

  // Only what changed is sent, so an entry on a since-retired project can keep it. A note that was cleared is sent
  // as `null` (the API's way to clear it); one that never changes is not sent at all.
  const updateEntry = (date, id, { project, hours, user: owner, type, note }) => attempt(async () => {
    const existing = (state.entries[date] || []).find((e) => e.id === id);
    if (!existing) throw new Error("This entry no longer exists.");
    const changes = {};
    if (project !== existing.project) changes.project_id = projectId(project);
    if (Number(hours) !== existing.hours) changes.hours = Number(hours);
    if (owner && owner !== existing.user) changes.user_id = ownerId(owner);
    if (type && type !== existing.type) changes.entry_type = type;
    const trimmedNote = (note || "").trim();
    if (trimmedNote !== (existing.note || "")) changes.note = trimmedNote || null;
    if (Object.keys(changes).length === 0) return;
    const updated = toUiEntry(await apiUpdateEntry(id, changes));
    setState((s) => ({ ...s, entries: withEntry(s.entries, id, updated) }));
  });

  const moveEntry = (date, id, targetDate) => attempt(async () => {
    const existing = (state.entries[date] || []).find((e) => e.id === id);
    if (!existing) throw new Error("This entry no longer exists.");
    const updated = toUiEntry(await apiUpdateEntry(id, { entry_date: targetDate }));
    setState((s) => ({ ...s, entries: withEntry(s.entries, id, updated) }));
  });

  const removeEntry = (date, id) => attempt(async () => {
    try {
      await apiDeleteEntry(id);
    } catch (e) {
      if (e.status !== 404) throw e; // already deleted by someone else: it is gone either way
    }
    setState((s) => ({ ...s, entries: withEntry(s.entries, id, null) }));
  });

  // Deletes ALL of the signed-in user's entries (every month), then shows what is left.
  const clearAll = () => attempt(async () => {
    await apiClearMyEntries();
    await load();
  });

  return { ...state, reload: load, addEntry, updateEntry, moveEntry, removeEntry, clearAll };
}
