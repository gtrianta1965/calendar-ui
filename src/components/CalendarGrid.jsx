function CalendarGrid({ year, month, entries, userOf, selected, todayKey, onSelect }) {
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
          onSelect={() => onSelect(cell.key)}
        />
      ))}
    </div>
  );
}
