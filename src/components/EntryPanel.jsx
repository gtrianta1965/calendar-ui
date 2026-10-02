// Edit/Save/Cancel match the admin console's icon buttons (admin/src/components/DataTable.jsx) exactly, so the
// same action reads the same way everywhere - Save doubles as "Add" here (this one button does both, unlike
// DataTable.jsx's separate "+ Add" text button and inline Save); Delete is this panel's own (the admin console
// never deletes anything - see DataTable.jsx's own comment on that). Duplicated here rather than shared: this
// page and the admin console are separate HTML entry points with no shared module scope (plain script globals,
// loaded per page).
const IconEdit = () => (
  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M13.5 3.5l3 3L6 17H3v-3z" />
  </svg>
);
const IconSave = () => (
  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 10.5l4 4 8-8.5" />
  </svg>
);
const IconCancel = () => (
  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
    <path d="M5 5l10 10M15 5L5 15" />
  </svg>
);
const IconDelete = () => (
  <svg viewBox="0 0 20 20" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 6h12M8 6V4.5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1V6M6 6l.8 10.2a1 1 0 0 0 1 .8h4.4a1 1 0 0 0 1-.8L14 6" />
  </svg>
);

// owners: the users an entry can be given to, [{ username, label, color }] (never an administrator); currentUser: the signed-in username;
// userOf(username): an entry owner's { id, label, color }; isShown(username): whether that user's entries are checked;
// isTypeShown(type): whether "forecast" / "actual" entries are checked (EntryTypeFilter).
// onAdd, onUpdate and onRemove call the API and resolve with { ok: true } or { ok: false, error }.
function EntryPanel({ dateKey: selectedKey, owners, currentUser, isAdmin, restrictUserToActuals, userOf, isShown, isTypeShown, entries, onAdd, onUpdate, onRemove }) {
  // Select values are strings. project "" means nothing chosen yet; hours starts at the default.
  const [project, setProject] = React.useState("");
  const [hours, setHours] = React.useState(String(DEFAULT_HOURS));
  const canAddForecast = isAdmin || !restrictUserToActuals;
  const [type, setType] = React.useState(canAddForecast ? "forecast" : "actual");
  const [note, setNote] = React.useState("");             // one line, optional
  // Whose entry: the signed-in user when adding, the entry's own when editing. An administrator is not among the owners
  // (they do not keep entries for themselves), so they must choose one: "" means nobody chosen yet.
  const defaultOwner = owners.some((o) => o.username === currentUser) ? currentUser : "";
  const [owner, setOwner] = React.useState(defaultOwner);
  const [editingId, setEditingId] = React.useState(null);
  const [historyId, setHistoryId] = React.useState(null);   // the entry whose change history is open (one at a time)
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
    setProject(""); setHours(String(DEFAULT_HOURS)); setType(canAddForecast ? "forecast" : "actual"); setNote("");
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
    } else if (!isTypeShown(type)) {
      // Likewise for a kind of entry the "Show forecast" / "Show actuals" boxes currently hide.
      const kind = type === "actual" ? "actuals" : "forecast";
      setHiddenNote(`Saved as ${type === "actual" ? "an actual" : "a forecast"}, and ${kind} are not shown. Tick "Show ${kind}" to see it.`);
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
  // A restricted user editing an existing forecast entry (an admin can create one for them, bypassing the
  // actual-only rule on creation): "Forecast" must stay a real option here too, or the select shows "Actual"
  // (the only option) while `type` is still "forecast" underneath - Save then sees no change and silently
  // leaves the entry as forecast, even though the user believes they just set it to Actual.
  const canPickForecast = canAddForecast || type === "forecast";
  const option = (p) => <option key={p.id} value={p.label}>{p.label}</option>;
  // Who last touched an entry, for the small line under it: the last editor once it has been changed, otherwise who
  // added it. An entry older than the audit columns has neither, and gets no line at all rather than a guess.
  const nameOf = (username) => (userOf(username) || {}).label || username;
  const touchedLine = (e) => e.modifiedBy ? `Last edited by ${nameOf(e.modifiedBy)} · ${formatWhen(e.updatedAt)}`
    : e.createdBy ? `Added by ${nameOf(e.createdBy)} · ${formatWhen(e.createdAt)}` : "";
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
            {/* Always rendered, empty when there is no note, so the owner/type/hours columns line up from row to row. */}
            <span className="note">{e.note}</span>
            <span className="owner" title="Whose entry">
              <span className="user-dot" style={{ background: (userOf(e.user) || {}).color }} />
              {(userOf(e.user) || {}).label || e.user}
            </span>
            <span className="type">{e.type === "actual" ? "Actual" : "Forecast"}</span>
            <span className="hours">{formatHours(e.hours)}</span>
            <button className="icon-button" onClick={() => startEdit(e)} disabled={busy} title="Edit" aria-label="Edit">
              <IconEdit />
            </button>
            <button className="icon-button danger" onClick={() => remove(e.id)} disabled={busy} title="Delete" aria-label="Delete">
              <IconDelete />
            </button>
            <div className="meta">
              <span>{touchedLine(e)}</span>
              <button type="button" className="link-button" aria-expanded={historyId === e.id}
                      onClick={() => setHistoryId(historyId === e.id ? null : e.id)}>
                {historyId === e.id ? "Hide history" : "History"}
              </button>
            </div>
            {historyId === e.id && <EntryHistory key={e.id} entryId={e.id} updatedAt={e.updatedAt} />}
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
            {canPickForecast && <option value="forecast">Forecast</option>}
            <option value="actual">Actual</option>
          </select>
          <button
            className="icon-button primary"
            onClick={save}
            disabled={!canSave || busy}
            title={editingId ? "Save" : "Add"}
            aria-label={editingId ? "Save" : "Add"}
          >
            {busy ? "…" : <IconSave />}
          </button>
          {editingId && (
            <button className="icon-button" onClick={resetEditor} disabled={busy} title="Cancel" aria-label="Cancel">
              <IconCancel />
            </button>
          )}
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
