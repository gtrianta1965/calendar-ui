// Customers that projects belong to. Retiring one (is_active = false) hides its projects from the entry
// form's dropdown; existing entries and the customer itself are kept, never deleted.
function CustomersAdmin({ reloadToken, onChanged }) {
  const [state, setState] = React.useState({ rows: [], status: "loading", error: "" });

  const load = React.useCallback(async () => {
    setState((s) => ({ ...s, status: "loading" }));
    try {
      setState({ rows: await apiAdminListCustomers(), status: "ready", error: "" });
    } catch (e) {
      setState({ rows: [], status: "error", error: e.message });
    }
  }, []);

  React.useEffect(() => { load(); }, [load, reloadToken]);

  const columns = [
    { key: "name", label: "Name", type: "text", required: true },
    { key: "is_active", label: "Status", type: "checkbox", omitOnCreate: true },
    { key: "created_at", label: "Created", type: "readonly" },
  ];

  if (state.status === "loading") return <p className="muted">Loading customers…</p>;
  if (state.status === "error") {
    return <p className="auth-error" role="alert">Could not load customers: {state.error} <button onClick={load}>Retry</button></p>;
  }

  const refresh = () => { load(); if (onChanged) onChanged(); }; // projects show customer names: let that tab know

  return (
    <DataTable
      title="Customers"
      columns={columns}
      rows={state.rows}
      newDefaults={{}}
      addLabel="+ Add customer"
      onCreate={async (values) => { const r = await attempt(() => apiAdminCreateCustomer(values)); if (r.ok) refresh(); return r; }}
      onUpdate={async (id, changes) => { const r = await attempt(() => apiAdminUpdateCustomer(id, changes)); if (r.ok) refresh(); return r; }}
    />
  );
}
