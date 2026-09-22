// Projects under a customer. Retiring one (is_active = false) hides it from the entry form's dropdown, the
// same as a customer; a project can also be "not selectable" without being retired itself, if ITS customer
// is the one that was retired - shown as a plain badge here, never editable (retire the customer instead).
//
// customersVersion: bumped by CustomersAdmin when a customer is added or renamed, so the "Customer" dropdown
// here reloads without switching tabs.
function ProjectsAdmin({ reloadToken, customersVersion }) {
  const [state, setState] = React.useState({ rows: [], status: "loading", error: "" });
  const [customers, setCustomers] = React.useState([]);

  const load = React.useCallback(async () => {
    setState((s) => ({ ...s, status: "loading" }));
    try {
      const [rows, custs] = await Promise.all([apiAdminListProjects(), apiAdminListCustomers()]);
      setCustomers(custs);
      setState({ rows, status: "ready", error: "" });
    } catch (e) {
      setState({ rows: [], status: "error", error: e.message });
    }
  }, []);

  React.useEffect(() => { load(); }, [load, reloadToken, customersVersion]);

  const columns = [
    {
      key: "customer_id", label: "Customer", type: "select", required: true, parse: Number,
      options: customers.map((c) => ({ value: c.id, label: c.name + (c.is_active ? "" : " (retired)") })),
      display: (row) => row.customer_name,
    },
    { key: "name", label: "Project", type: "text", required: true },
    { key: "project_manager", label: "Project manager", type: "text" },
    { key: "project_number", label: "Project number", type: "text" },
    { key: "is_active", label: "Status", type: "checkbox", omitOnCreate: true },
    {
      key: "is_selectable", label: "In dropdown", type: "readonly",
      display: (row) => row ? (
        <span className={"pill " + (row.is_selectable ? "pill-on" : "pill-off")}>
          {row.is_selectable ? "Yes" : row.is_active ? "No (customer retired)" : "No"}
        </span>
      ) : "–",
    },
    { key: "created_at", label: "Created", type: "readonly" },
  ];

  if (state.status === "loading") return <p className="muted">Loading projects…</p>;
  if (state.status === "error") {
    return <p className="auth-error" role="alert">Could not load projects: {state.error} <button onClick={load}>Retry</button></p>;
  }

  return (
    <DataTable
      title="Projects"
      columns={columns}
      rows={state.rows}
      newDefaults={{ customer_id: customers.find((c) => c.is_active)?.id }}
      addLabel="+ Add project"
      onCreate={async (values) => { const r = await attempt(() => apiAdminCreateProject(values)); if (r.ok) load(); return r; }}
      onUpdate={async (id, changes) => { const r = await attempt(() => apiAdminUpdateProject(id, changes)); if (r.ok) load(); return r; }}
    />
  );
}
