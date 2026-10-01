// What happened to one entry, from the API's audit rows, newest first: "30-09-2026 21:24  user amavraki changed the
// hours from 2 to 3." Loaded when it is opened, and again whenever the entry changes (`updatedAt`), so a list that is
// left open never goes stale after an edit. A list that comes back after the entry was edited again is ignored if the
// component has moved on (`current`), the same way useEntries.js ignores a slow, outdated request.
function EntryHistory({ entryId, updatedAt }) {
  const [state, setState] = React.useState({ status: "loading", items: [], error: "" });

  React.useEffect(() => {
    let current = true;
    apiEntryHistory(entryId)
      .then((items) => { if (current) setState({ status: "ready", items, error: "" }); })
      .catch((err) => { if (current) setState({ status: "error", items: [], error: err.message }); });
    return () => { current = false; };
  }, [entryId, updatedAt]);

  if (state.status === "error") return <div className="history muted" role="alert">Could not load the history: {state.error}</div>;
  if (state.status === "loading") return <div className="history muted">Loading…</div>;
  if (state.items.length === 0) return <div className="history muted">No changes recorded for this entry.</div>;
  return (
    <ul className="history">
      {state.items.map((row) => (
        <li key={row.id}><time>{formatWhen(row.audit_date)}</time> {row.description}</li>
      ))}
    </ul>
  );
}
