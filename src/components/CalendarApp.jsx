// The calendar for one signed-in user. `user` is their username, `profile` their record from the API
// (id, name, role, color) and `users` everyone in the user directory. The entries live in the API. It shows the entries
// of the checked users only: at first just the signed-in user's.
//
// Administrators are not listed: they do not keep entries for themselves, they add, edit and delete the entries of
// other users. So the list of users (the check boxes) and the User dropdown of the form leave them out, and a signed-in
// administrator starts with nobody checked and chooses whose entries to work with.
function CalendarApp({ user, profile, users, onLogout }) {
  const now = new Date();
  const isAdmin = profile.role === "admin";
  const listedUsers = React.useMemo(() => users.filter((u) => u.role !== "admin"), [users]);
  const todayKey = dateKey(now.getFullYear(), now.getMonth(), now.getDate());

  // Start where the user was before a page reload (if they were somewhere), otherwise on today's month.
  const [saved] = React.useState(loadView);
  const [year, setYear] = React.useState(saved ? saved.year : now.getFullYear());
  const [month, setMonth] = React.useState(saved ? saved.month : now.getMonth());
  const [selected, setSelected] = React.useState(saved ? saved.selected : null);
  // The checked users (their ids). At first only the signed-in user (nobody for an administrator, who is not listed);
  // after a reload, as they were left.
  const [shown, setShown] = React.useState(() => {
    const listed = new Set([...listedUsers.map((u) => u.id), ...(isAdmin ? [] : [profile.id])]);
    const kept = saved && saved.shown ? saved.shown.filter((id) => listed.has(id)) : null;
    return kept && (kept.length > 0 || saved.shown.length === 0) ? kept : isAdmin ? [] : [profile.id];
  });
  React.useEffect(() => { saveView({ year, month, selected, shown }); }, [year, month, selected, shown]);
  const toggleShown = (id) => setShown((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  const [confirmingClear, setConfirmingClear] = React.useState(false);
  const [clearError, setClearError] = React.useState("");
  const catalog = useProjects();                     // the customer-project choices, from the API

  // Who an entry belongs to, from the user directory (the signed-in user's own record is a fallback):
  // { id, username, label, color, active }, where label is the full name or else the username.
  const known = React.useMemo(() => {
    const byName = {};
    for (const u of [...users, profile]) {
      byName[u.username.toLowerCase()] = {
        id: u.id, username: u.username, label: u.full_name || u.username, color: u.color, active: u.is_active !== false,
      };
    }
    return byName;
  }, [users, profile]);
  const userOf = (username) => known[String(username).toLowerCase()];
  // The users an entry can be given to: the active ones (the API refuses a deactivated user), administrators left out.
  const owners = React.useMemo(() => {
    const list = listedUsers.filter((u) => u.is_active).map((u) => known[u.username.toLowerCase()]);
    return isAdmin || list.some((o) => o.username === user) ? list : [known[user.toLowerCase()], ...list];
  }, [listedUsers, known, user, isAdmin]);

  // What the form shows -> the ids the API wants (undefined when unknown).
  const projectIdOf = React.useCallback(
    (label) => (catalog.projects.find((p) => p.label === label) || {}).id, [catalog.projects]);
  const userIdOf = React.useCallback((username) => (known[String(username).toLowerCase()] || {}).id, [known]);
  const activeUserIdOf = React.useCallback((username) => {
    const u = known[String(username).toLowerCase()];
    return u && u.active ? u.id : undefined;
  }, [known]);

  // The entries on screen: the first to the last cell of the month grid (adjacent-month days included).
  const [from, to] = React.useMemo(() => {
    const grid = monthGrid(year, month);
    return [grid[0].key, grid[grid.length - 1].key];
  }, [year, month]);
  const entriesState = useEntries({ from, to, userIds: shown, projectIdOf, userIdOf });
  const { addEntry, updateEntry, removeEntry, clearAll } = entriesState;
  // Only the checked users' entries are shown: also right after an entry is added or moved to someone unchecked.
  const isShown = (username) => shown.includes(userIdOf(username));
  const entries = React.useMemo(() => {
    const visible = {};
    for (const [date, list] of Object.entries(entriesState.entries)) {
      const kept = list.filter((e) => shown.includes(e.userId));
      if (kept.length) visible[date] = kept;
    }
    return visible;
  }, [entriesState.entries, shown]);

  const changeMonth = (delta) => {
    const d = new Date(year, month + delta, 1);
    setYear(d.getFullYear());
    setMonth(d.getMonth());
  };

  // Loads what is on screen again, to see what others changed: the entries, and the project choices.
  const refresh = () => {
    entriesState.reload();
    catalog.reload();
  };

  const goToday = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth());
    setSelected(todayKey);
  };

  const confirmClear = async () => {
    const result = await clearAll();
    setClearError(result.ok ? "" : `Clear data failed: ${result.error}`);
    setSelected(null);
    setConfirmingClear(false);
  };

  return (
    <div className="app">
      <Header
        year={year}
        month={month}
        profile={profile}
        onPrev={() => changeMonth(-1)}
        onToday={goToday}
        onNext={() => changeMonth(1)}
        onRefresh={refresh}
        refreshing={entriesState.status === "loading"}
        onClear={() => setConfirmingClear(true)}
        canClear
        onLogout={onLogout}
      />
      <UserList users={listedUsers} meId={profile.id} shown={shown} onToggle={toggleShown} />
      {shown.length === 0 && (
        <p className="muted banner">No user is checked, so no entries are shown.</p>
      )}
      {catalog.status === "error" && (
        <p className="auth-error banner" role="alert">
          The customer-project list could not be loaded: {catalog.error}{" "}
          <button onClick={catalog.reload}>Retry</button>
        </p>
      )}
      {entriesState.status === "error" && (
        <p className="auth-error banner" role="alert">
          The entries could not be loaded: {entriesState.error}{" "}
          <button onClick={entriesState.reload}>Retry</button>
        </p>
      )}
      {entriesState.truncated && (
        <p className="auth-error banner" role="alert">
          Only the first {ENTRIES_LIMIT} entries of these dates are shown.
        </p>
      )}
      {clearError && (
        <p className="auth-error banner" role="alert">
          {clearError} <button onClick={() => setClearError("")}>Dismiss</button>
        </p>
      )}
      <ImportBanner
        ready={catalog.status === "ready"}
        projectIdOf={projectIdOf}
        activeUserIdOf={activeUserIdOf}
        onImported={entriesState.reload}
      />
      <CalendarGrid
        year={year}
        month={month}
        entries={entries}
        userOf={userOf}
        selected={selected}
        todayKey={todayKey}
        onSelect={setSelected}
      />
      <EntryPanel
        dateKey={selected}
        owners={owners}
        currentUser={user}
        userOf={userOf}
        isShown={isShown}
        entries={selected ? entries[selected] || [] : []}
        onAdd={addEntry}
        onUpdate={updateEntry}
        onRemove={removeEntry}
      />
      {confirmingClear && (
        <ConfirmDialog
          title="Clear all data?"
          message={`This permanently deletes ALL entries saved for ${user}, in every month. Other users' entries are not affected. This cannot be undone.`}
          confirmLabel="Clear data"
          onConfirm={confirmClear}
          onCancel={() => setConfirmingClear(false)}
        />
      )}
    </div>
  );
}
