// Offers to move the entries this browser saved before entries lived in the API into the API.
// Shown only while such entries exist. `ready` is false until the project list and the users have loaded
// (until then nothing could be matched). `onImported` is called after an import, to show the new entries.
function ImportBanner({ ready, projectIdOf, activeUserIdOf, onImported }) {
  const [version, setVersion] = React.useState(0);       // bumped after an import, to read the browser's store again
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState("");
  const [hidden, setHidden] = React.useState(false);

  const total = React.useMemo(countLocalEntries, [version]);
  const plan = React.useMemo(
    () => (ready ? planLocalImport({ projectIdOf, activeUserIdOf }) : { ready: [], skipped: 0 }),
    [version, ready, projectIdOf, activeUserIdOf]);

  if (hidden || (total === 0 && !message)) return null;

  const run = async () => {
    setBusy(true);
    setMessage("");
    let text;
    try {
      const n = await importLocalEntries(plan);
      text = `Imported ${n} ${n === 1 ? "entry" : "entries"} into the API.`;
    } catch (e) {
      text = `The import stopped: ${e.message} Entries already imported are kept in the API; the rest are still saved in this browser.`;
    }
    setBusy(false);
    setMessage(text);
    setVersion((v) => v + 1);
    onImported();
  };

  return (
    <p className="banner import-banner" role="status">
      {total > 0 && (
        <span>
          {total} {total === 1 ? "entry" : "entries"} saved in this browser from before entries moved to the API {total === 1 ? "is" : "are"} not
          in the API yet.{" "}
          {plan.skipped > 0 && `${plan.skipped} cannot be imported (their project is retired, or their user is inactive or unknown) and would stay here. `}
        </span>
      )}
      {message && <span>{message} </span>}
      {total > 0 && (!ready || plan.ready.length > 0) && (
        <button onClick={run} disabled={!ready || busy}>
          {busy ? "Importing…" : ready ? `Import ${plan.ready.length}` : "Import"}
        </button>
      )}
      <button onClick={() => setHidden(true)}>Hide</button>
    </p>
  );
}
