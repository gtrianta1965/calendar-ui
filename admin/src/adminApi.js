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

// DataTable's onCreate/onUpdate convention (see useEntries.js): resolve with { ok: true } or { ok: false, error },
// never throw. Wraps any of the calls above: attempt(() => apiAdminCreateUser(values)).
async function attempt(fn) {
  try { await fn(); return { ok: true }; }
  catch (e) { return { ok: false, error: e.message }; }
}
