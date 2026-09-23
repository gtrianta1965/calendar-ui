function CalendarGrid({ year, month, entries, userOf, selected, todayKey, onSelect, onMove }) {
  const [dragged, setDragged] = React.useState(null);
  const [dropTarget, setDropTarget] = React.useState(null);
  const [moving, setMoving] = React.useState(false);

  const dragStart = (event, entry) => {
    event.stopPropagation();
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/calendar-entry", JSON.stringify({ id: entry.id, date: entry.date }));
    setDragged(entry);
  };

  const dragEnd = () => {
    setDragged(null);
    setDropTarget(null);
  };

  const dragOver = (event, key) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragged && key !== dragged.date) setDropTarget(key);
  };

  const drop = async (key) => {
    if (!dragged || key === dragged.date || moving) return;
    setMoving(true);
    await onMove(dragged.date, dragged.id, key);
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
          onDrop={() => drop(cell.key)}
        />
      ))}
    </div>
  );
}
