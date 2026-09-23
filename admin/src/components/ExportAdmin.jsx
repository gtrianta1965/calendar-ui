// Downloads a CSV of cal_entries_v (every entry, with the names and ids of its user, project and customer already
// joined in) for a date range, optionally narrowed to one user, customer or project - built for Excel, a pivot
// table, or any other reporting tool. Starts on the current calendar month, since that is the common case.
function ExportAdmin() {
  const today = new Date();
  // Local-date formatting, deliberately NOT toISOString(): that converts to UTC first, which silently shifts
  // the date back a day in any timezone ahead of UTC (e.g. Greece) when applied to a local midnight Date.
  const ymd = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const monthStart = (d) => ymd(new Date(d.getFullYear(), d.getMonth(), 1));
  const monthEnd = (d) => ymd(new Date(d.getFullYear(), d.getMonth() + 1, 0));

  const [dateFrom, setDateFrom] = React.useState(monthStart(today));
  const [dateTo, setDateTo] = React.useState(monthEnd(today));
  const [userId, setUserId] = React.useState("");
  const [customerId, setCustomerId] = React.useState("");
  const [projectId, setProjectId] = React.useState("");
  const [lists, setLists] = React.useState({ status: "loading", error: "", users: [], customers: [], projects: [] });
  const [allColumns, setAllColumns] = React.useState(false);
  const [busy, setBusy] = React.useState("");          // "" | "csv" | "xlsx" - which button is downloading
  const [message, setMessage] = React.useState("");
  const [error, setError] = React.useState("");

  const load = React.useCallback(async () => {
    setLists((s) => ({ ...s, status: "loading" }));
    try {
      const [users, customers, projects] = await Promise.all([
        apiAdminListUsers(), apiAdminListCustomers(), apiAdminListProjects(),
      ]);
      setLists({ status: "ready", error: "", users, customers, projects });
    } catch (e) {
      setLists((s) => ({ ...s, status: "error", error: e.message }));
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  // Jump the date range to a whole calendar month, picked from a dropdown of the last 12 plus the next 2.
  const monthOptions = React.useMemo(() => {
    const opts = [];
    for (let i = -12; i <= 2; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      opts.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString(undefined, { month: "long", year: "numeric" }), date: d });
    }
    return opts;
  }, []);
  const pickMonth = (value) => {
    const opt = monthOptions.find((o) => o.value === value);
    if (!opt) return;
    setDateFrom(monthStart(opt.date));
    setDateTo(monthEnd(opt.date));
  };
  const currentMonthValue = `${dateFrom.slice(0, 4)}-${dateFrom.slice(5, 7)}`;

  const download = async (format) => {
    setBusy(format);
    setError("");
    setMessage("");
    const label = (id, list) => (list.find((x) => String(x.id) === String(id)) || {}).name
      || (list.find((x) => String(x.id) === String(id)) || {}).username || "";
    const parts = [dateFrom, dateTo];
    if (userId) parts.push(label(userId, lists.users) || `user${userId}`);
    if (customerId) parts.push(label(customerId, lists.customers));
    if (projectId) parts.push(label(projectId, lists.projects));
    const filename = `entries_${parts.join("_")}.${format}`.replace(/[^A-Za-z0-9_.-]+/g, "-");
    const params = { date_from: dateFrom, date_to: dateTo, user_id: userId, customer_id: customerId, project_id: projectId };
    const columns = allColumns ? null : EXPORT_DEFAULT_COLUMNS;      // the shared constant in adminApi.js
    try {
      const rows = format === "xlsx"
        ? await apiAdminDownloadExportXlsx(params, filename, columns)
        : await apiAdminDownloadExport(params, filename, columns);
      setMessage(rows === 1 ? "1 entry exported." : `${rows} entries exported.`);
    } catch (e) {
      setError(e.message);
    }
    setBusy("");
  };

  if (lists.status === "loading") return <p className="muted">Loading…</p>;
  if (lists.status === "error") {
    return <p className="auth-error" role="alert">Could not load users/customers/projects: {lists.error} <button onClick={load}>Retry</button></p>;
  }

  return (
    <div className="data-table export-admin">
      <div className="data-table-head">
        <h2>Export</h2>
      </div>
      <p className="muted">
        Downloads every entry in the range below - one row each, with the user, project and customer already
        filled in - ready for Excel or a pivot table. XLSX keeps Hours as real numbers regardless of the
        opening machine's regional settings; CSV is plain text, for anything else that reads it.
      </p>
      {error && <p className="auth-error" role="alert">{error}</p>}
      {message && <p className="muted" role="status">{message}</p>}
      <div className="export-fields">
        <label className="export-field">
          <span>Month</span>
          <select value={currentMonthValue} onChange={(e) => pickMonth(e.target.value)}>
            <option value="">(custom range)</option>
            {monthOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </label>
        <label className="export-field">
          <span>From</span>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </label>
        <label className="export-field">
          <span>To</span>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </label>
        <label className="export-field">
          <span>User</span>
          <select value={userId} onChange={(e) => setUserId(e.target.value)}>
            <option value="">All users</option>
            {lists.users.map((u) => <option key={u.id} value={u.id}>{u.full_name || u.username}</option>)}
          </select>
        </label>
        <label className="export-field">
          <span>Customer</span>
          <select value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
            <option value="">All customers</option>
            {lists.customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="export-field">
          <span>Project</span>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
            <option value="">All projects</option>
            {lists.projects.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </label>
      </div>
      <label className="inline-field export-all-columns">
        <input type="checkbox" checked={allColumns} onChange={(e) => setAllColumns(e.target.checked)} />
        Export all columns
      </label>
      <p className="muted export-columns-note">
        {allColumns
          ? "Every column reports/export has: ids, type, billable, manager, active flags and more."
          : `Just ${EXPORT_DEFAULT_COLUMNS.join(", ")}.`}
      </p>
      <div className="export-actions">
        <button className="primary" onClick={() => download("xlsx")} disabled={!!busy || !dateFrom || !dateTo}>
          {busy === "xlsx" ? "Downloading…" : "Download XLSX"}
        </button>
        <button onClick={() => download("csv")} disabled={!!busy || !dateFrom || !dateTo}>
          {busy === "csv" ? "Downloading…" : "Download CSV"}
        </button>
      </div>
    </div>
  );
}
