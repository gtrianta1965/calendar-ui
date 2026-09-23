// The month being viewed, and the controls that change or refresh it. Kept apart from Header (session-level
// things you touch rarely: who you are, Admin, Clear data, Log out) since these are what you use constantly
// while working the calendar - so they sit right above the grid they control, not mixed into the top bar.
function CalendarToolbar({ year, month, onPrev, onToday, onNext, onRefresh, refreshing }) {
  return (
    <div className="toolbar">
      <h2>{MONTHS[month]} {year}</h2>
      <button onClick={onPrev} aria-label="Previous month">&lt; Prev</button>
      <button onClick={onToday}>Today</button>
      <button onClick={onNext} aria-label="Next month">Next &gt;</button>
      <button onClick={onRefresh} disabled={refreshing} title="Load the entries and projects again, to see what others changed">
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
    </div>
  );
}
