// Two check boxes that choose which kinds of entry the calendar shows: forecast, actual, or both (both at first).
// Purely a view setting: nothing is changed or reloaded, CalendarApp just leaves the other kind out of the one list the
// grid, the pivot and the entry panel draw from. `showForecast` / `showActual` are the current values and
// `onForecastChange(checked)` / `onActualChange(checked)` set them.
function EntryTypeFilter({ showForecast, showActual, onForecastChange, onActualChange }) {
  return (
    <div className="type-filter">
      <label>
        <input type="checkbox" checked={showForecast} onChange={(e) => onForecastChange(e.target.checked)} />
        Show forecast
      </label>
      <label>
        <input type="checkbox" checked={showActual} onChange={(e) => onActualChange(e.target.checked)} />
        Show actuals
      </label>
    </div>
  );
}
