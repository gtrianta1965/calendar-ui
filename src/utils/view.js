// Remembers which month and date are on screen (plain script, exposes globals).
//
// It is kept in sessionStorage, so a page reload (or anything that reloads the page, such as a live-reload server
// noticing that the database file changed) comes back to the same month, selected date and checked users instead of
// starting over.
// It ends with the tab, and is cleared when someone logs in or out.

const VIEW_STORAGE_KEY = "calendar-view-v1";

// { year, month (0-based), selected ("YYYY-MM-DD" or null), shown (user ids, or null),
//   layout ("calendar" or "pivot") }, or null when nothing valid is saved.
function loadView() {
  try {
    const v = JSON.parse(sessionStorage.getItem(VIEW_STORAGE_KEY) || "null");
    if (!v || !Number.isInteger(v.year) || !Number.isInteger(v.month) || v.month < 0 || v.month > 11) return null;
    const selected = typeof v.selected === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v.selected) ? v.selected : null;
    const shown = Array.isArray(v.shown) ? v.shown.filter(Number.isInteger) : null;
    const layout = v.layout === "pivot" ? "pivot" : "calendar";
    return { year: v.year, month: v.month, selected, shown, layout };
  } catch (e) {
    return null;
  }
}

function saveView(view) {
  try { sessionStorage.setItem(VIEW_STORAGE_KEY, JSON.stringify(view)); } catch (e) {}
}

function clearView() {
  try { sessionStorage.removeItem(VIEW_STORAGE_KEY); } catch (e) {}
}
