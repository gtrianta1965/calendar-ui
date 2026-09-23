// A read-only alternative to CalendarGrid: the same month's entries (already loaded, already filtered to the
// checked users - nothing new is fetched), laid out with dates down the left and resources across the top,
// for scanning who did what across a whole month at a glance rather than day by day. Clicking a date still
// selects it (opens it below in EntryPanel, same as the calendar view); there is no drag-and-drop or in-cell
// editing here - the day panel is still where an entry actually gets changed.
// `columns` is the checked users, in the same order as the User row's checkboxes: [{ id, label, color }].
function MonthPivot({ year, month, entries, columns, selected, todayKey, onSelect }) {
  const total = daysInMonth(year, month);
  const days = Array.from({ length: total }, (_, i) => i + 1);

  if (columns.length === 0) return null;   // CalendarApp already shows "No user is checked" above this

  return (
    <div className="pivot-scroll">
      <table className="pivot">
        <thead>
          <tr>
            <th className="pivot-date-head">Date</th>
            {columns.map((u) => (
              <th key={u.id}>
                <span className="user-dot" style={{ background: u.color }} />
                {u.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day) => {
            const key = dateKey(year, month, day);
            const dayEntries = entries[key] || [];
            const cls = ["pivot-row", key === todayKey && "today", key === selected && "selected"].filter(Boolean).join(" ");
            return (
              <tr key={key} className={cls} onClick={() => onSelect(key)}>
                <th scope="row" className="pivot-date">{day}</th>
                {columns.map((u) => {
                  const cellEntries = dayEntries.filter((e) => e.userId === u.id);
                  return (
                    <td key={u.id} style={{ "--user-color": u.color }}>
                      {cellEntries.map((e) => (
                        <div key={e.id} className="pivot-entry" title={formatEntry(e)}>{formatEntry(e)}</div>
                      ))}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
