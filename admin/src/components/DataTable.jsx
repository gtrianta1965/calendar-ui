// A generic editable grid, reused by UsersAdmin, CustomersAdmin and ProjectsAdmin: one row per record, an
// inline "Edit" that turns a row's own cells into inputs, and an "Add" row built the same way. There is no
// delete anywhere in this app, on purpose: the API only ever retires (is_active = 0), never removes, so
// that history stays attributable.
//
// columns: [{ key, label, type, options?, display?, parse?, required?, editOnly?, immutableAfterCreate? }]
//   type: "text" | "email" | "password" | "select" | "checkbox" | "color" | "readonly"
//   options: [{ value, label }], for type "select"
//   display(row): a custom read-mode AND edit-mode renderer (falls back to a type-appropriate default)
//   parse(value): converts the input's string value before it is sent (for example customer_id -> Number)
//   required: only enforced when creating
//   editOnly: not shown as a column at all in read mode (used for "password": there is nothing to display)
//   immutableAfterCreate: an ordinary input while creating, plain text once the row exists (used for "username":
//     the API has no rename)
//
// rows: the records, each with idKey (default "id"). newDefaults: starting values for the "Add" row.
// onCreate(values) / onUpdate(id, changes): async, resolve with { ok: true } or { ok: false, error }, the
// same convention the rest of the app uses (see EntryPanel's onAdd/onUpdate).
function DataTable({ title, columns, rows, idKey = "id", newDefaults = {}, onCreate, onUpdate, addLabel }) {
  const [editingId, setEditingId] = React.useState(null); // null | "new" | a row's id
  const [draft, setDraft] = React.useState({});
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState("");
  const [query, setQuery] = React.useState("");

  const visible = columns.filter((c) => !c.editOnly);
  const editable = columns.filter((c) => c.type !== "readonly");

  const startCreate = () => { setEditingId("new"); setDraft({ ...newDefaults }); setError(""); };
  const startEdit = (row) => {
    const d = {};
    for (const c of editable) d[c.key] = row[c.key];
    setEditingId(row[idKey]); setDraft(d); setError("");
  };
  const cancel = () => { setEditingId(null); setDraft({}); setError(""); };
  const setField = (key, value) => setDraft((d) => ({ ...d, [key]: value }));

  const save = async () => {
    if (busy) return;
    if (editingId === "new") {
      const missing = columns.find((c) => c.required && !draft[c.key] && draft[c.key] !== false);
      if (missing) { setError(`${missing.label} is required.`); return; }
      const values = {};
      for (const c of columns) {
        if (c.omitOnCreate) continue; // a new row starts with whatever the API itself defaults to
        const raw = draft[c.key];
        if (raw === undefined || raw === "") continue; // omit blanks: the API fills in its own defaults
        values[c.key] = c.parse ? c.parse(raw) : raw;
      }
      setBusy(true);
      const result = await onCreate(values);
      setBusy(false);
      if (result.ok) cancel(); else setError(result.error);
    } else {
      const row = rows.find((r) => r[idKey] === editingId);
      const changes = {};
      for (const c of editable) {
        const raw = draft[c.key];
        if (c.type === "password") {
          if (raw) changes[c.key] = raw; // blank = leave the password as it is
          continue;
        }
        if (c.immutableAfterCreate) continue; // never sent back: nothing to change
        const value = c.parse ? c.parse(raw) : raw;
        if (value !== row[c.key]) changes[c.key] = value;
      }
      if (Object.keys(changes).length === 0) { cancel(); return; }
      setBusy(true);
      const result = await onUpdate(editingId, changes);
      setBusy(false);
      if (result.ok) cancel(); else setError(result.error);
    }
  };

  const shown = query
    ? rows.filter((r) => visible.some((c) => String(r[c.key] ?? "").toLowerCase().includes(query.toLowerCase())))
    : rows;

  // field(c, row): the editable cell for column c. row is the record being edited, or null while creating.
  // display(row), when a column has one, only ever changes what READ mode shows (shownValue below) - here it
  // only applies to a "readonly" column (nothing to edit, just a nicer static value than the raw one), never
  // to a real input: a select or a text field must stay editable even when its read-mode text is customized
  // (customer_id shows the customer's name, but is still a dropdown of ids while being edited).
  const field = (c, row) => {
    const value = draft[c.key];
    if (c.immutableAfterCreate && row) return <span className="static">{row[c.key]}</span>;
    if (c.omitOnCreate && !row) return <span className="static muted-cell">Active (default)</span>;
    if (c.type === "readonly") {
      return <span className="static muted-cell">{row ? (c.display ? c.display(row) : formatTimestamp(row[c.key])) : "–"}</span>;
    }
    if (c.type === "select") {
      return (
        <select value={value ?? ""} onChange={(e) => setField(c.key, e.target.value)}>
          {!c.required && <option value="">&mdash;</option>}
          {c.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      );
    }
    if (c.type === "checkbox") {
      return <input type="checkbox" checked={!!value} onChange={(e) => setField(c.key, e.target.checked)} />;
    }
    if (c.type === "color") {
      return (
        <span className="color-field">
          <span className="user-dot" style={{ background: value || "#ccc" }} />
          <input type="text" value={value ?? ""} placeholder="#0052cc" onChange={(e) => setField(c.key, e.target.value)} />
        </span>
      );
    }
    if (c.type === "password") {
      return (
        <input
          type="password"
          value={value ?? ""}
          placeholder={row ? "Leave blank to keep it" : "At least 8 characters"}
          onChange={(e) => setField(c.key, e.target.value)}
        />
      );
    }
    return <input type={c.type === "email" ? "email" : "text"} value={value ?? ""} onChange={(e) => setField(c.key, e.target.value)} />;
  };

  // shownValue(row, c): the read-only cell for column c, when row is not being edited.
  const shownValue = (row, c) => {
    if (c.display) return c.display(row, { editing: false });
    if (c.type === "readonly") return formatTimestamp(row[c.key]);
    if (c.type === "checkbox") return <span className={"pill " + (row[c.key] ? "pill-on" : "pill-off")}>{row[c.key] ? "Active" : "Retired"}</span>;
    if (c.type === "color") return (
      <span className="color-field"><span className="user-dot" style={{ background: row[c.key] }} />{row[c.key]}</span>
    );
    if (c.type === "select") {
      const opt = c.options.find((o) => String(o.value) === String(row[c.key]));
      return opt ? opt.label : row[c.key];
    }
    const text = row[c.key];
    return text === null || text === undefined || text === "" ? <span className="static muted-cell">&ndash;</span> : text;
  };

  // editOnly columns (password) have nothing to show in the table's own columns, so they get a labeled strip
  // of their own under the row, instead of a column every other row would show a dash in.
  const editOnlyCols = columns.filter((c) => c.editOnly);

  const editRow = (row) => {
    const key = row ? row[idKey] : "new";
    return [
      <tr className="editing" key={key}>
        {visible.map((c) => <td key={c.key}>{field(c, row)}</td>)}
        <td className="actions">
          <button className="primary" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save"}</button>
          <button onClick={cancel} disabled={busy}>Cancel</button>
        </td>
      </tr>,
      editOnlyCols.length > 0 && (
        <tr className="editing editing-extra" key={key + "-extra"}>
          <td colSpan={visible.length + 1}>
            {editOnlyCols.map((c) => (
              <label className="inline-field" key={c.key}>
                <span>{c.label}</span>
                {field(c, row)}
              </label>
            ))}
          </td>
        </tr>
      ),
    ];
  };

  return (
    <div className="data-table">
      <div className="data-table-head">
        <h2>{title}</h2>
        <input className="filter" type="search" placeholder={`Filter ${title.toLowerCase()}…`} value={query} onChange={(e) => setQuery(e.target.value)} />
        {editingId === null && <button className="primary" onClick={startCreate}>{addLabel || `+ Add`}</button>}
      </div>
      {error && <p className="auth-error" role="alert">{error}</p>}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {visible.map((c) => <th key={c.key}>{c.label}</th>)}
              <th className="actions">&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {editingId === "new" && editRow(null)}
            {shown.map((row) => (
              editingId === row[idKey] ? editRow(row) : (
                <tr key={row[idKey]}>
                  {visible.map((c) => <td key={c.key}>{shownValue(row, c)}</td>)}
                  <td className="actions"><button onClick={() => startEdit(row)}>Edit</button></td>
                </tr>
              )
            ))}
            {shown.length === 0 && editingId !== "new" && (
              <tr><td className="static muted-cell" colSpan={visible.length + 1}>Nothing here{query ? " matches" : " yet"}.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
