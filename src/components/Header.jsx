// Session-level chrome: who you are, and the things you touch rarely - Admin, Clear data (destructive, kept up
// here rather than near the frequently-clicked calendar controls) and Log out. The month/navigation controls are
// CalendarToolbar's job, right above the grid they affect.
function Header({ profile, onClear, canClear, onLogout }) {
  return (
    <div className="header">
      <h1>Simple Calendar</h1>
      <span className="user">
        Signed in as <span className="user-dot" style={{ background: profile.color }} />
        <strong>{profile.full_name || profile.username}</strong>
        {profile.role && <span className="role"> ({profile.role})</span>}
      </span>
      {profile.role === "admin" && (
        <a className="button" href="admin/index.html" title="Manage users, customers and projects">
          Admin
        </a>
      )}
      <button className="danger" onClick={onClear} disabled={!canClear}>Clear data</button>
      <button onClick={onLogout}>Log out</button>
    </div>
  );
}
