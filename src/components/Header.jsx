function Header({ year, month, profile, onPrev, onToday, onNext, onRefresh, refreshing, onClear, canClear, onLogout }) {
  return (
    <div className="header">
      <h1>{MONTHS[month]} {year}</h1>
      <span className="user">
        Signed in as <span className="user-dot" style={{ background: profile.color }} />
        <strong>{profile.full_name || profile.username}</strong>
        {profile.role && <span className="role"> ({profile.role})</span>}
      </span>
      <button onClick={onPrev} aria-label="Previous month">&lt; Prev</button>
      <button onClick={onToday}>Today</button>
      <button onClick={onNext} aria-label="Next month">Next &gt;</button>
      <button onClick={onRefresh} disabled={refreshing} title="Load the entries and projects again, to see what others changed">
        {refreshing ? "Refreshing…" : "Refresh"}
      </button>
      <button className="danger" onClick={onClear} disabled={!canClear}>Clear data</button>
      {profile.role === "admin" && (
        <a className="button" href="admin/index.html" title="Manage users, customers and projects">
          Admin
        </a>
      )}
      <button onClick={onLogout}>Log out</button>
    </div>
  );
}
