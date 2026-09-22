// owners: the users an entry can be given to, [{ username, label, color }] (never an administrator); currentUser: the signed-in username;
// userOf(username): an entry owner's { id, label, color }; isShown(username): whether that user's entries are checked.
// onAdd, onUpdate and onRemove call the API and resolve with { ok: true } or { ok: false, error }.
function EntryPanel({ dateKey: selectedKey, owners, currentUser, userOf, isShown, entries, onAdd, onUpdate, onRemove }) {
  // Select values are strings. project "" means nothing chosen yet; hours starts at the default.
  const [project, setProject] = React.useState("");
  const [hours, setHours] = React.useState(String(DEFAULT_HOURS));
  const [type, setType] = React.useState("forecast");    // a new entry starts as a forecast, not yet worked
  const [note, setNote] = React.useState("");             // one line, optional
  // Whose entry: the signed-in user when adding, the entry's own when editing. An administrator is not among the owners
  // (they do not keep entries for themselves), so they must choose one: "" means nobody chosen yet.
  const defaultOwner = owners.some((o) => o.username === currentUser) ? currentUser : "";
  const [owner, setOwner] = React.useState(defaultOwner);
  const [editingId, setEditingId] = React.useState(null);
  const [busy, setBusy] = React.useState(false);            // an API call is in progress
  const [failure, setFailure] = React.useState("");         // why the last add / change / delete failed
  const [hiddenNote, setHiddenNote] = React.useState("");   // saved, but for a user whose entries are not shown

  // The customer-project choices, favorites-first for the CHOSEN owner (not necessarily the signed-in user): so
  // when the User dropdown changes, the list below reorders to that person's favorites. Reloads whenever the
  // owner changes; while nobody is chosen yet (an administrator, before they pick someone) it falls back to the
  // API's own default, the signed-in user.
  const ownerId = owner ? (userOf(owner) || {}).id : undefined;
  const catalog = useProjects(ownerId);

  const resetEditor = () => {
    setProject(""); setHours(String(DEFAULT_HOURS)); setType("forecast"); setNote("");
    setOwner(defaultOwner); setEditingId(null); setFailure(""); setHiddenNote("");
  };

  // Start with a clean editor whenever a different date is selected.
  React.useEffect(resetEditor, [selectedKey]);

  if (!selectedKey) {
    return (
      <div className="panel">
        <p className="muted">Click a date to add or edit its entries.</p>
      </div>
    );
  }

  const canSave = project !== "" && owner !== "";

  // On success the form starts over; on failure it keeps what was typed and says what went wrong.
  const save = async () => {
    if (!canSave || busy) return;
    setBusy(true);
    setFailure("");
    const fields = { project, hours: Number(hours), user: owner, type, note };
    const result = editingId ? await onUpdate(selectedKey, editingId, fields) : await onAdd(selectedKey, fields);
    setBusy(false);
    if (!result.ok) {
      setFailure(result.error);
      return;
    }
    resetEditor();
    // An entry for a user whose box is unchecked is saved but not shown: say so instead of letting it seem lost.
    if (!isShown(owner)) {
      setHiddenNote(`Saved for ${(userOf(owner) || {}).label || owner}, whose entries are not shown. Tick their box to see them.`);
    }
  };

  const remove = async (id) => {
    if (busy) return;
    setBusy(true);
    setFailure("");
    const result = await onRemove(selectedKey, id);
    setBusy(false);
    if (!result.ok) setFailure(result.error);
    else if (editingId === id) resetEditor();
  };

  const startEdit = (e) => {
    setEditingId(e.id);
    setOwner(e.user);
    setProject(e.project);
    setHours(String(e.hours));
    setType(e.type || "forecast");
    setNote(e.note || "");
  };

  // Favorites come first from the API; when there are any, they get a group of their own.
  const favorites = catalog.projects.filter((p) => p.is_favorite);
  const others = catalog.projects.filter((p) => !p.is_favorite);
  // If a stored value is no longer offered (a retired project, or the list did not load), keep it selectable while editing.
  const stray = project && !catalog.projects.some((p) => p.label === project) ? project : null;
  // An entry's owner who is not offered (deactivated, or unknown) stays selectable while editing.
  const strayOwner = owner && !owners.some((o) => o.username === owner) ? owner : null;
  const option = (p) => <option key={p.id} value={p.label}>{p.label}</option>;
  const placeholder = catalog.status === "loading" ? "Loading projects…"
    : catalog.status === "error" ? "Projects unavailable" : "Customer - Project…";
  const hourOptions = HOUR_OPTIONS.includes(Number(hours))
    ? HOUR_OPTIONS : [...HOUR_OPTIONS, Number(hours)];

  return (
    <div className="panel">
      <h2>Entries for {formatDate(selectedKey)}</h2>
      {entries.length === 0 && <p className="muted">No entries yet.</p>}
      <ul>
        {entries.map((e) => (
          <li key={e.id} title={e.note || undefined}>
            <span className="text">{e.project}</span>
            <span className="owner" title="Whose entry">
              <span className="user-dot" style={{ background: (userOf(e.user) || {}).color }} />
              {(userOf(e.user) || {}).label || e.user}
            </span>
            <span className="type">{e.type === "actual" ? "Actual" : "Forecast"}</span>
            <span className="hours">{formatHours(e.hours)}</span>
            <button onClick={() => startEdit(e)} disabled={busy}>Edit</button>
            <button className="danger" onClick={() => remove(e.id)} disabled={busy}>Delete</button>
          </li>
        ))}
      </ul>
      <div onKeyDown={(e) => { if (e.key === "Escape") resetEditor(); }}>
        <div className="row">
          <select
            className="owner-select"
            aria-label="User"
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
          >
            {owner === "" && <option value="" disabled>User…</option>}
            {owners.map((o) => <option key={o.username} value={o.username}>{o.label}</option>)}
            {strayOwner && <option value={strayOwner}>{strayOwner}</option>}
          </select>
          <select
            className="project-select"
            aria-label="Customer - Project"
            value={project}
            onChange={(e) => setProject(e.target.value)}
          >
            <option value="" disabled>{placeholder}</option>
            {favorites.length > 0
              ? <>
                  <optgroup label="Favorites">{favorites.map(option)}</optgroup>
                  <optgroup label="Other projects">{others.map(option)}</optgroup>
                </>
              : others.map(option)}
            {stray && <option value={stray}>{stray}</option>}
          </select>
          <select
            className="hours-select"
            aria-label="Hours"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
          >
            {hourOptions.map((h) => <option key={h} value={h}>{formatHours(h)}</option>)}
          </select>
          <select
            className="type-select"
            aria-label="Actual or forecast"
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="forecast">Forecast</option>
            <option value="actual">Actual</option>
          </select>
          <button className="primary" onClick={save} disabled={!canSave || busy}>
            {busy ? "Saving…" : editingId ? "Save" : "Add"}
          </button>
          {editingId && <button onClick={resetEditor} disabled={busy}>Cancel</button>}
        </div>
        <div className="row note-row">
          <input
            type="text"
            className="note-input"
            aria-label="Note"
            placeholder="Note (optional)"
            value={note}
            maxLength={1000}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>
      {failure && <p className="auth-error" role="alert">{failure}</p>}
      {hiddenNote && <p className="muted" role="status">{hiddenNote}</p>}
    </div>
  );
}
