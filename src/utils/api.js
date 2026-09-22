// Talking to the API (plain script, exposes globals).
//
// Every call goes to API_BASE_URL (src/config.js). Once signed in, the bearer token that the API handed
// out is sent on each call. The token is kept in sessionStorage, so it is forgotten when the tab closes.
// Passwords are sent once, to log in, and never stored.

const TOKEN_STORAGE_KEY = "calendar-token-v1"; // sessionStorage

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status; // the HTTP status, or 0 when the API could not be reached at all
  }
}

function getToken() {
  try { return sessionStorage.getItem(TOKEN_STORAGE_KEY); } catch (e) { return null; }
}

function setToken(token) {
  try { sessionStorage.setItem(TOKEN_STORAGE_KEY, token); } catch (e) {}
}

function clearToken() {
  try { sessionStorage.removeItem(TOKEN_STORAGE_KEY); } catch (e) {}
}

// Called (once) when the API says the token is no longer good, so the app can go back to the login page.
let unauthorizedHandler = null;
function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler;
}

// The API's own reason, in words: `detail` is a string, or (for invalid input) a list of field errors.
function describeError(status, detail, response) {
  if (typeof detail === "string") {
    if (status === 429) {
      const wait = response.headers.get("Retry-After");
      return wait ? `${detail} Try again in ${wait} seconds.` : detail;
    }
    return detail;
  }
  if (Array.isArray(detail) && detail.length) {
    return detail.map((d) => `${(d.loc || []).slice(1).join(".") || "input"}: ${d.msg}`).join("; ");
  }
  return status >= 500 ? "The API had an error. Try again." : `The API answered ${status}.`;
}

// Resolves with the parsed JSON (null for "204 No Content") or rejects with an ApiError.
// `auth: false` is for calls that must not carry a token (login).
async function apiRequest(path, { method = "GET", body, auth = true, notifyExpired = true, token = getToken() } = {}) {
  const headers = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (auth && token) headers["Authorization"] = "Bearer " + token;

  let response;
  try {
    response = await fetch(API_BASE_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch (e) {
    throw new ApiError(`Cannot reach the API at ${API_BASE_URL}. Is it running?`, 0);
  }

  if (response.ok) return response.status === 204 ? null : response.json();

  let detail;
  try { detail = (await response.json()).detail; } catch (e) {}
  if (response.status === 401 && auth && token) {
    clearToken();
    if (notifyExpired && unauthorizedHandler) unauthorizedHandler();
  }
  throw new ApiError(describeError(response.status, detail, response), response.status);
}

// Signs in and remembers the token. Resolves with the signed-in user: { id, username, full_name, role, color, ... }.
async function apiLogin(username, password) {
  const result = await apiRequest("/auth/login", { method: "POST", body: { username, password }, auth: false });
  setToken(result.access_token);
  return result.user;
}

const apiMe = () => apiRequest("/auth/me");

// Everyone's id, username, full_name, color and is_active (nothing private). Open to any signed-in user.
const apiUsers = () => apiRequest("/users/directory");

// The customer-project choices for the entry form: active projects, one user's favorites first (the signed-in
// user's by default, or forUserId's when given, so the list reflects whoever the entry is being made for).
const apiProjectOptions = (forUserId) =>
  apiRequest(forUserId == null ? "/projects/options" : `/projects/options?user_id=${forUserId}`);

// Entries of the given users (a list of user ids). `from` and `to` are YYYY-MM-DD, both inclusive; up to 5000.
const apiEntries = (from, to, userIds) =>
  apiRequest(`/entries?date_from=${from}&date_to=${to}&${userIds.map((id) => `user_id=${id}`).join("&")}&limit=5000`);
const apiCreateEntry = (body) => apiRequest("/entries", { method: "POST", body });
// `changes` holds only the fields that change: project_id, hours, user_id, ...
const apiUpdateEntry = (id, changes) => apiRequest(`/entries/${id}`, { method: "PATCH", body: changes });
const apiDeleteEntry = (id) => apiRequest(`/entries/${id}`, { method: "DELETE" });
// Deletes ALL of the signed-in user's own entries (never anyone else's).
const apiClearMyEntries = () => apiRequest("/entries?confirm=true", { method: "DELETE" });
// 1 to 500 entries at once, all or none.
const apiCreateEntries = (entries) => apiRequest("/entries/bulk", { method: "POST", body: { entries } });

// Forgets the token at once, then ends the session on the server too.
async function apiLogout() {
  const token = getToken();
  clearToken();
  if (!token) return;
  try {
    await apiRequest("/auth/logout", { method: "POST", token, notifyExpired: false });
  } catch (e) {
    // Already expired, or the API is down: either way there is nothing left to end.
  }
}
