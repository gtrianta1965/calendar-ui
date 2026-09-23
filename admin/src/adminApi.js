// Admin-only calls to the API (plain script, exposes globals). Built on apiRequest from ../../src/utils/api.js
// (loaded before this file, see admin/index.html): same token, same error shape, nothing duplicated.
//
// The main app never needs any of these (it only ever lists ITS OWN or the public directory, and never
// creates/edits a user, customer or project), which is why they live here and not in src/utils/api.js.

// ---- users (all fields, not the trimmed /users/directory the main app uses)
const apiAdminListUsers = () => apiRequest("/users");
const apiAdminCreateUser = (body) => apiRequest("/users", { method: "POST", body });
// `changes` holds only the fields that change: full_name, email, role, is_active, password, color.
const apiAdminUpdateUser = (id, changes) => apiRequest(`/users/${id}`, { method: "PATCH", body: changes });

// ---- customers (include_inactive=true so retired ones are still visible and can be reactivated)
const apiAdminListCustomers = () => apiRequest("/customers?include_inactive=true");
const apiAdminCreateCustomer = (body) => apiRequest("/customers", { method: "POST", body });
const apiAdminUpdateCustomer = (id, changes) => apiRequest(`/customers/${id}`, { method: "PATCH", body: changes });

// ---- projects (same: include_inactive=true)
const apiAdminListProjects = () => apiRequest("/projects?include_inactive=true");
const apiAdminCreateProject = (body) => apiRequest("/projects", { method: "POST", body });
const apiAdminUpdateProject = (id, changes) => apiRequest(`/projects/${id}`, { method: "PATCH", body: changes });

// ---- favorites: everyone's at once (for the Favorites tab), and adding/removing one for a given user.
const apiAdminAllFavorites = () => apiRequest("/favorites/all");
const apiAdminSetFavorite = (projectId, userId, on) =>
  apiRequest(`/favorites/${projectId}?user_id=${userId}`, { method: on ? "PUT" : "DELETE" });

// ---- export: reports/export answers a CSV file, not JSON, so this bypasses apiRequest (which always expects
// JSON). `params` holds date_from/date_to (required) and any of user_id/customer_id/project_id (blank/undefined =
// no filter on that one). Shared by both download functions below.
async function fetchExportCsv(params) {
  const query = Object.entries(params)
    .filter(([, v]) => v !== "" && v !== undefined && v !== null)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  const token = getToken();
  const headers = token ? { Authorization: "Bearer " + token } : {};
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/reports/export?${query}`, { headers });
  } catch (e) {
    throw new Error(`Cannot reach the API at ${API_BASE_URL}. Is it running?`);
  }
  if (!response.ok) {
    let detail;
    try { detail = (await response.json()).detail; } catch (e) {}
    throw new Error(describeError(response.status, detail, response));
  }
  return response.text();
}

// Triggers a normal browser download of a Blob/anchor pair - shared by the CSV and XLSX download functions.
// `filename` is chosen by the caller, not read back from the response: Content-Disposition is not among the
// headers CORS exposes to a cross-origin fetch (the admin console and the API are almost always on different
// origins), so trying to read it back here would silently come up empty in production even though it works
// when both happen to share an origin.
function triggerDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// The default (non-"all columns") download's columns, in the order they should appear - edit this list to
// change what a normal export includes. Names must match reports/export's header row exactly; a name that
// doesn't match throws (in selectColumns below) instead of silently coming up empty.
const EXPORT_DEFAULT_COLUMNS = ["Date", "Full Name", "Customer", "Project", "Label", "Hours", "Note"];

// Columns that must land as real Excel dates, with no time-of-day (see rowsToWorkbook), and ones that must
// land as real numbers, not text (so Excel doesn't force whoever opens the file to reparse "3.50" using
// whichever regional decimal separator their machine happens to use - the same class of bug the backend
// itself has to guard against with NLS_NUMERIC_CHARACTERS for the CSV response).
const EXPORT_DATE_COLUMNS = ["Date", "Created", "Updated"];
const EXPORT_NUMERIC_COLUMNS = ["Entry ID", "Year", "Month", "Hours", "User ID", "Project ID", "Customer ID"];

// Splits the CSV response into a plain grid of strings - SheetJS is used here only as a quote-aware CSV
// splitter (it understands the quoting reports/export uses: quoted fields, doubled quotes, embedded commas),
// with `raw: true` so it does none of its own number/date/boolean guessing - every value comes back exactly as
// the API sent it, and rowsToWorkbook below is the one place that decides which columns become which type.
function parseExportCsv(text) {
  const workbook = XLSX.read(text, { type: "string", raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, defval: "" }).map((row) => row.map(String));
}

// Picks and reorders columns by name. `columns` is EXPORT_DEFAULT_COLUMNS, or null/undefined for every column
// reports/export sent, in its own order (the "Export all columns" checkbox).
function selectColumns(grid, columns) {
  const header = grid[0] || [];
  const names = columns || header;
  const indices = names.map((name) => header.indexOf(name));
  const missing = names.filter((_, i) => indices[i] < 0);
  if (missing.length) throw new Error(`reports/export has no column(s) named: ${missing.join(", ")}`);
  return { header: names, rows: grid.slice(1).map((row) => indices.map((i) => row[i])) };
}

function rowsToCsv(header, rows) {
  const field = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [header, ...rows].map((row) => row.map(field).join(",")).join("\r\n") + "\r\n";
}

// Builds a workbook cell by cell (rather than handing the grid to a SheetJS conversion helper) so each column's
// type is exactly what's decided here, nothing guessed: EXPORT_DATE_COLUMNS become real dates with no
// time-of-day, EXPORT_NUMERIC_COLUMNS become real numbers, everything else stays plain text. A date is built
// from its numeric year/month/day, never by parsing the ISO string: SheetJS reads a date cell's calendar fields
// with *local* getters when it computes the serial number (the same reason ExportAdmin.jsx's own month math
// builds dates this way rather than through toISOString/UTC), so this is what keeps the date exactly the
// calendar day the API reported regardless of the viewer's timezone - Created/Updated are UTC timestamps, and
// the date wanted is that UTC calendar date, not whichever day it falls on after a timezone shift.
function rowsToWorkbook(header, rows) {
  const sheet = {};
  const set = (r, c, cell) => { sheet[XLSX.utils.encode_cell({ r, c })] = cell; };
  header.forEach((name, c) => set(0, c, { t: "s", v: name }));
  rows.forEach((row, r) => row.forEach((value, c) => {
    const name = header[c];
    const dateMatch = EXPORT_DATE_COLUMNS.includes(name) && /^(\d{4})-(\d{2})-(\d{2})/.exec(value || "");
    if (dateMatch) {
      const [, y, m, d] = dateMatch;
      set(r + 1, c, { t: "d", v: new Date(Number(y), Number(m) - 1, Number(d)), z: "yyyy-mm-dd" });
    } else if (EXPORT_NUMERIC_COLUMNS.includes(name) && value !== "" && !Number.isNaN(Number(value))) {
      set(r + 1, c, { t: "n", v: Number(value) });
    } else if (value !== "") {
      set(r + 1, c, { t: "s", v: value });
    }
  }));
  sheet["!ref"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: rows.length, c: Math.max(0, header.length - 1) } });
  sheet["!cols"] = header.map((_, c) => ({
    wch: Math.min(40, Math.max(8, ...[header[c], ...rows.map((row) => row[c])].map((v) => String(v ?? "").length)) + 1),
  }));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Entries");
  return workbook;
}

// Resolves with the number of data rows (for a "N entries exported" message), or throws like any other API call.
// `columns`: EXPORT_DEFAULT_COLUMNS, or null/undefined for every column ("Export all columns" checked).
async function apiAdminDownloadExport(params, filename, columns) {
  const { header, rows } = selectColumns(parseExportCsv(await fetchExportCsv(params)), columns);
  triggerDownload(new Blob([rowsToCsv(header, rows)], { type: "text/csv" }), filename);
  return rows.length;
}

// Same data and the same column selection, as a real .xlsx instead of CSV.
async function apiAdminDownloadExportXlsx(params, filename, columns) {
  const { header, rows } = selectColumns(parseExportCsv(await fetchExportCsv(params)), columns);
  const bytes = XLSX.write(rowsToWorkbook(header, rows), { type: "array", bookType: "xlsx" });
  triggerDownload(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
  return rows.length;
}

// DataTable's onCreate/onUpdate convention (see useEntries.js): resolve with { ok: true } or { ok: false, error },
// never throw. Wraps any of the calls above: attempt(() => apiAdminCreateUser(values)).
async function attempt(fn) {
  try { await fn(); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
}
