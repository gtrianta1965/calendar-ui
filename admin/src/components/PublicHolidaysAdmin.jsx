// Public holidays, by country. Insert-only: the API has no PATCH/DELETE for these yet (see ords/ords.md and
// ords/ords.sql's cal_public_holidays_api), so this tab only lists and adds - no "Edit" button, ever.
function PublicHolidaysAdmin() {
  const [state, setState] = React.useState({ rows: [], status: "loading", error: "" });

  const load = React.useCallback(async () => {
    setState((s) => ({ ...s, status: "loading" }));
    try {
      setState({ rows: await apiAdminListHolidays(), status: "ready", error: "" });
    } catch (e) {
      setState({ rows: [], status: "error", error: e.message });
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const columns = [
    { key: "holiday_date", label: "Date", type: "date", required: true, display: (row) => formatTimestamp(row.holiday_date) },
    { key: "description", label: "Description", type: "text", required: true },
    { key: "country", label: "Country", type: "text", required: true },
    { key: "year", label: "Year", type: "readonly", display: (row) => row.year },
    { key: "created_at", label: "Created", type: "readonly" },
  ];

  if (state.status === "loading") return <p className="muted">Loading public holidays…</p>;
  if (state.status === "error") {
    return <p className="auth-error" role="alert">Could not load public holidays: {state.error} <button onClick={load}>Retry</button></p>;
  }

  return (
    <DataTable
      title="Public Holidays"
      columns={columns}
      rows={state.rows}
      newDefaults={{}}
      addLabel="+ Add public holiday"
      onCreate={async (values) => { const r = await attempt(() => apiAdminCreateHoliday(values)); if (r.ok) load(); return r; }}
    />
  );
}
