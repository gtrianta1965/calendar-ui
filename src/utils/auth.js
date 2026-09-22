// Sign-in and session, against the API (plain script, exposes globals).
//
// The API checks the password and hands back a bearer token (see api.js). The users come from the API too:
// nothing about accounts is stored in this project's files or in the browser except that token.

// Returns { ok: true, user } or { ok: false, error } with the API's own reason (wrong password, too many
// attempts, API not running, ...).
async function loginUser(username, password) {
  try {
    return { ok: true, user: await apiLogin(String(username).trim(), password) };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// The signed-in user for the token saved in this tab, or null when there is none.
// Rejects (with an ApiError) when the API cannot say: not running, or the token is no longer valid.
async function restoreSession() {
  return getToken() ? apiMe() : null;
}

// Everyone in the user directory, or [] if it cannot be read: the list is a nicety, and signing in must
// not depend on it.
async function loadUsers() {
  try {
    return await apiUsers();
  } catch (e) {
    return [];
  }
}

const logoutUser = apiLogout;
