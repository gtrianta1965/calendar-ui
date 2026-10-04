// Two check boxes that choose which kinds of entry the calendar shows: forecast, actual, or both (both at first).
// Purely a view setting: nothing is changed or reloaded, CalendarApp just leaves the other kind out of the one list the
// grid, the pivot and the entry panel draw from. `showForecast` / `showActual` are the current values and
// `onForecastChange(checked)` / `onActualChange(checked)` set them. The small swatches show how each kind is drawn in the
// calendar (a forecast with a dashed left bar, an actual with a solid one), in neutral gray: see .entry in css/styles.css.
function EntryTypeFilter({ showForecast, showActual, onForecastChange, onActualChange }) {
  return (
    <div className="type-filter">
      <label>
        <input type="checkbox" checked={showForecast} onChange={(e) => onForecastChange(e.target.checked)} />
        <span className="type-swatch forecast" aria-hidden="true" />
        Show forecast
      </label>
      <label>
        <input type="checkbox" checked={showActual} onChange={(e) => onActualChange(e.target.checked)} />
        <span className="type-swatch" aria-hidden="true" />
        Show actuals
      </label>
    </div>
  );
}
