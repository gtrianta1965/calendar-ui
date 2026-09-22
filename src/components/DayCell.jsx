// monthLabel (e.g. "Aug") is only passed for days outside the displayed month.
// userOf(username) is the entry owner's { label, color }, or undefined when the owner is not known.
function DayCell({ day, monthLabel, entries, userOf, isOutside, isToday, isSelected, onSelect }) {
  const cls = ["cell", isOutside && "outside", isToday && "today", isSelected && "selected"]
    .filter(Boolean).join(" ");

  return (
    <div className={cls} onClick={onSelect}>
      <span className="num">{monthLabel ? `${monthLabel} ${day}` : day}</span>
      {entries.map((e) => {
        const owner = userOf(e.user);
        return (
          <div key={e.id} className="entry" style={{ "--user-color": owner && owner.color }}
               title={`${formatEntry(e)} (${owner ? owner.label : e.user})`}>
            {formatEntry(e)}
          </div>
        );
      })}
    </div>
  );
}
