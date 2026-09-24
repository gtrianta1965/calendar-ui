// Everyone who can sign in. Loads its own copy of GET /users (all fields, unlike the main app's trimmed
// /users/directory) so it stays independent of whatever the calendar page itself has loaded.
//
// Not editable here, on purpose: `username` (the API has no rename - it is the identity a user signs in
// with) and `role` cannot be pushed down to zero active administrators (the API enforces this with a 409;
// this screen just shows that message back, it does not try to predict it).
function UsersAdmin({ reloadToken }) {
  const [state, setState] = React.useState({ rows: [], status: "loading", error: "" });
  const technologyGroupOptions = TECHNOLOGY_GROUP_LIST.split("|")
    .filter(Boolean)
    .map((value) => ({ value, label: value }));

  const load = React.useCallback(async () => {
    setState((s) => ({ ...s, status: "loading" }));
    try {
      setState({ rows: await apiAdminListUsers(), status: "ready", error: "" });
    } catch (e) {
      setState({ rows: [], status: "error", error: e.message });
    }
  }, []);

  React.useEffect(() => { load(); }, [load, reloadToken]);

  const columns = [
    { key: "username", label: "Username", type: "text", required: true, immutableAfterCreate: true },
    { key: "full_name", label: "Full name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "role", label: "Role", type: "select", options: [{ value: "user", label: "User" }, { value: "admin", label: "Administrator" }] },
    { key: "technology_group", label: "Technology group", type: "select", options: technologyGroupOptions, parse: (value) => value || null },
    { key: "is_active", label: "Status", type: "checkbox", omitOnCreate: true },
    { key: "color", label: "Color", type: "color" },
    { key: "password", label: "Password", type: "password", editOnly: true, required: true },
    { key: "created_at", label: "Created", type: "readonly" },
  ];

  if (state.status === "loading") return <p className="muted">Loading users…</p>;
  if (state.status === "error") {
    return <p className="auth-error" role="alert">Could not load users: {state.error} <button onClick={load}>Retry</button></p>;
  }

  return (
    <DataTable
      title="Users"
      columns={columns}
      rows={state.rows}
      newDefaults={{ role: "user" }}
      addLabel="+ Add user"
      onCreate={async (values) => { const r = await attempt(() => apiAdminCreateUser(values)); if (r.ok) load(); return r; }}
      onUpdate={async (id, changes) => { const r = await attempt(() => apiAdminUpdateUser(id, changes)); if (r.ok) load(); return r; }}
    />
  );
}
