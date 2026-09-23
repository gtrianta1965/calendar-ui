// Projects on the left, every non-admin user on the right: pick a project and its checkbox column shows who
// already has it as a favorite, checked or unchecked to add or remove it for that person. Administrators are
// left out (favorites are only ever a regular user's, the same reason UserList leaves them out of the calendar's
// own checkbox row). One GET (favorites/all) loads everyone's favorites up front, so picking a different project
// needs no extra request - only a checkbox toggle does, and only for the row that changed.
function FavoritesAdmin() {
  const [state, setState] = React.useState({ status: "loading", error: "", projects: [], users: [], favorites: [] });
  const [selected, setSelected] = React.useState(null);   // a project id, or null before anything is picked
  const [busyKey, setBusyKey] = React.useState(null);     // "<projectId>:<userId>" while that checkbox is saving
  const [rowError, setRowError] = React.useState("");

  const load = React.useCallback(async () => {
    setState((s) => ({ ...s, status: "loading" }));
    try {
      const [projects, users, favorites] = await Promise.all([
        apiAdminListProjects(), apiAdminListUsers(), apiAdminAllFavorites(),
      ]);
      setState({ status: "ready", error: "", projects, users, favorites });
    } catch (e) {
      setState((s) => ({ ...s, status: "error", error: e.message }));
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  // Administrators keep no favorites of their own (they add entries for other users, not themselves - see
  // CalendarApp.jsx), so they never appear in the right-hand column, the same way UserList leaves them out.
  const favoritableUsers = React.useMemo(() => state.users.filter((u) => u.role !== "admin"), [state.users]);

  // project id -> Set of user ids who have it favorited, worked out once whenever the favorites list changes.
  const favoritesByProject = React.useMemo(() => {
    const map = new Map();
    for (const f of state.favorites) {
      if (!map.has(f.project_id)) map.set(f.project_id, new Set());
      map.get(f.project_id).add(f.user_id);
    }
    return map;
  }, [state.favorites]);

  const checkedUserIds = selected ? (favoritesByProject.get(selected) || new Set()) : new Set();
  const selectedProject = state.projects.find((p) => p.id === selected);

  const toggle = async (userId, checked) => {
    setBusyKey(`${selected}:${userId}`);
    setRowError("");
    const result = await attempt(() => apiAdminSetFavorite(selected, userId, checked));
    if (result.ok) {
      setState((s) => ({
        ...s,
        favorites: checked
          ? [...s.favorites, { project_id: selected, user_id: userId }]
          : s.favorites.filter((f) => !(f.project_id === selected && f.user_id === userId)),
      }));
    } else {
      setRowError(result.error);
    }
    setBusyKey(null);
  };

  if (state.status === "loading") return <p className="muted">Loading favorites…</p>;
  if (state.status === "error") {
    return <p className="auth-error" role="alert">Could not load favorites: {state.error} <button onClick={load}>Retry</button></p>;
  }

  return (
    <div className="data-table">
      <div className="data-table-head">
        <h2>Favorites</h2>
      </div>
      {rowError && <p className="auth-error" role="alert">{rowError}</p>}
      <div className="favorites-columns">
        <div className="favorites-pane">
          <h3>Projects</h3>
          <ul className="favorites-list">
            {state.projects.map((p) => (
              <li key={p.id}>
                <button
                  className={p.id === selected ? "favorites-pick active" : "favorites-pick"}
                  onClick={() => setSelected(p.id)}
                >
                  {p.label}
                  {!p.is_selectable && <span className="muted-cell"> (retired)</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="favorites-pane">
          <h3>{selectedProject ? <>Favorited by &mdash; <em>{selectedProject.label}</em></> : "Pick a project"}</h3>
          <ul className="favorites-list">
            {favoritableUsers.map((u) => {
              const key = `${selected}:${u.id}`;
              return (
                <li key={u.id}>
                  <label className="favorites-user">
                    <input
                      type="checkbox"
                      disabled={!selected || busyKey === key}
                      checked={checkedUserIds.has(u.id)}
                      onChange={(e) => toggle(u.id, e.target.checked)}
                    />
                    <span className="user-dot" style={{ background: u.color }} />
                    {u.full_name || u.username}
                    {!u.is_active && <span className="muted-cell"> (inactive)</span>}
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
