// Holding Shift while dropping copies the entry instead of moving it (onCopy) - the drop target's date gets a new
// entry with the dragged one's own project/hours/owner/type/note, and the dragged entry itself is left untouched.
// Dropping an entry back onto its own cell does nothing either way (a plain move already ignored this; a Shift-copy
// ignores it too, rather than duplicating an entry in place).
function CalendarGrid({ year, month, entries, userOf, selected, todayKey, onSelect, onMove, onCopy }) {
  const [dragged, setDragged] = React.useState(null);
  const [dropTarget, setDropTarget] = React.useState(null);
  const [moving, setMoving] = React.useState(false);

  const dragStart = (event, entry) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "copyMove";   // both allowed; dragOver picks one per the Shift key
    event.dataTransfer.setData("text/calendar-entry", JSON.stringify({ id: entry.id, date: entry.date }));
    setDragged(entry);
  };

  const dragEnd = () => {
    setDragged(null);
    setDropTarget(null);
  };

  const dragOver = (event, key) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = event.shiftKey ? "copy" : "move";   // the browser's own cursor hint
    if (dragged && key !== dragged.date) setDropTarget(key);
  };

  const drop = async (event, key) => {
    if (!dragged || key === dragged.date || moving) return;
    setMoving(true);
    if (event.shiftKey) await onCopy(dragged, key);
    else await onMove(dragged.date, dragged.id, key);
    setMoving(false);
    dragEnd();
  };

  return (
    <div className="grid">
      {DAYS.map((d) => <div key={d} className="dow">{d}</div>)}
      {monthGrid(year, month).map((cell) => (
        <DayCell
          key={cell.key}
          day={cell.day}
          monthLabel={cell.outside ? MONTHS[cell.month].slice(0, 3) : null}
          entries={entries[cell.key] || []}
          userOf={userOf}
          isOutside={cell.outside}
          isToday={cell.key === todayKey}
          isSelected={cell.key === selected}
          isDropTarget={dropTarget === cell.key}
          onSelect={() => onSelect(cell.key)}
          onDragStart={dragStart}
          onDragEnd={dragEnd}
          onDragOver={(event) => dragOver(event, cell.key)}
          onDrop={(event) => drop(event, cell.key)}
        />
      ))}
    </div>
  );
}
