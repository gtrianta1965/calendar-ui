// A read-only alternative to CalendarGrid: the same month's entries (already loaded, already filtered to the
// checked users - nothing new is fetched), laid out with dates down the left and resources across the top,
// for scanning who did what across a whole month at a glance rather than day by day. Clicking a date still
// selects it (opens it below in EntryPanel, same as the calendar view); there is no drag-and-drop or in-cell
// editing here - the day panel is still where an entry actually gets changed. The one exception is a right click on
// an entry: onEntryMenu(event, entry) lets CalendarApp open its EntryContextMenu (Duplicate).
// `columns` is the checked users, in the same order as the User row's checkboxes: [{ id, label, color }].
// holidays maps a 'YYYY-MM-DD' key to { description, countries } (see useHolidays.js) - a holiday's row gets a
// light grey background, plus a bold banner row of its own spanning every column, the same information
// CalendarGrid's DayCell shows in its own layout.
function MonthPivot({ year, month, entries, columns, holidays, selected, todayKey, onSelect, onEntryMenu }) {
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
            const weekdayIndex = (new Date(year, month, day).getDay() + 6) % 7;
            const weekday = DAYS[weekdayIndex];
            const dayEntries = entries[key] || [];
            const holiday = holidays && holidays[key];
            const cls = ["pivot-row", weekdayIndex >= 5 && "weekend", key === todayKey && "today", key === selected && "selected", holiday && "holiday"]
              .filter(Boolean).join(" ");
            return (
              <React.Fragment key={key}>
                {holiday && (
                  <tr className="pivot-holiday-row" onClick={() => onSelect(key)}>
                    <td className="pivot-holiday-banner" colSpan={columns.length + 1} title={`${holiday.description} (${holiday.countries})`}>
                      {holiday.description} ({holiday.countries})
                    </td>
                  </tr>
                )}
                <tr className={cls} onClick={() => onSelect(key)}>
                  <th scope="row" className="pivot-date">
                    <span>{weekday}</span>
                    <span>{day}</span>
                  </th>
                  {columns.map((u) => {
                    const cellEntries = dayEntries.filter((e) => e.userId === u.id);
                    return (
                      <td key={u.id} style={{ "--user-color": u.color }}>
                        {cellEntries.map((e) => (
                          <div key={e.id} className={`pivot-entry${e.type === "actual" ? " actual" : ""}`} title={e.note ? `${formatEntry(e)}\n${e.note}` : formatEntry(e)}
                               onContextMenu={(event) => onEntryMenu(event, e)}>{formatEntry(e)}</div>
                        ))}
                      </td>
                    );
                  })}
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
