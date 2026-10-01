// monthLabel (e.g. "Aug") is only passed for days outside the displayed month.
// userOf(username) is the entry owner's { label, color }, or undefined when the owner is not known.
// holiday, when the date is a public holiday, is { description, countries } (see useHolidays.js): countries is
// every country observing it that date, already comma-joined - "Description (Country, Country)" is one line.
function DayCell({ day, monthLabel, entries, userOf, holiday, isWeekend, isOutside, isToday, isSelected, isDropTarget, onSelect, onDragStart, onDragEnd, onDragOver, onDrop }) {
  const cls = ["cell", isOutside && "outside", isWeekend && "weekend", isToday && "today", isSelected && "selected", isDropTarget && "drop-target", holiday && "holiday"]
    .filter(Boolean).join(" ");

  return (
    <div className={cls} onClick={onSelect} onDragOver={onDragOver} onDrop={onDrop}>
      {holiday && (
        <div className="holiday-banner" title={`${holiday.description} (${holiday.countries})`}>
          {holiday.description} ({holiday.countries})
        </div>
      )}
      {/* The month prefix is skipped when this is also today's cell: the blue circle below already makes it
          unmistakable, and "Sep 28" doesn't fit the circle's fixed size the way a bare "28" does. */}
      <span className="num">{monthLabel && !isToday ? `${monthLabel} ${day}` : day}</span>
      {entries.map((e) => {
        const owner = userOf(e.user);
        return (
          <div key={e.id} className={`entry${e.type === "actual" ? " actual" : ""}`} draggable onDragStart={(event) => onDragStart(event, e)} onDragEnd={onDragEnd}
               style={{ "--user-color": owner && owner.color }}
               title={`${formatEntry(e)} (${owner ? owner.label : e.user}) - drag to move, Shift+drag to copy${e.note ? `\n${e.note}` : ""}`}>
            {formatEntry(e)}
          </div>
        );
      })}
    </div>
  );
}
