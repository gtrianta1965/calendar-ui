// The app bar across the top: the product, who you are, and the things you touch rarely - Admin, Clear data
// (destructive, kept up here rather than near the frequently-clicked calendar controls) and Log out. The
// month/navigation controls are CalendarToolbar's job, right above the grid they affect.
function Header({ profile, onClear, canClear, onLogout }) {
  const name = profile.full_name || profile.username;
  return (
    <header className="appbar">
      <div className="appbar-inner">
        <div className="brand">
          <BrandMark size={34} />
          <div className="brand-text">
            <h1 className="brand-name">Oracle Consulting Calendar</h1>
          </div>
        </div>
        {/* --user-color tints the avatar with the user's own color, the same color their entries have */}
        <div className="user-chip" style={{ "--user-color": profile.color }}>
          <span className="avatar" aria-hidden="true">{initialsOf(name)}</span>
          <span className="user-meta">
            <span className="user-name"><span className="sr-only">Signed in as </span>{name}</span>
            {profile.role && <span className="role">{profile.role}</span>}
          </span>
        </div>
        {profile.role === "admin" && (
          <a className="button" href="admin/index.html" title="Manage users, customers and projects">
            Admin
          </a>
        )}
        {/* Not used any more - hidden, not removed: onClear/canClear stay wired in case this comes back. */}
        <button className="danger" onClick={onClear} disabled={!canClear} style={{ display: "none" }}>Clear data</button>
        <button onClick={onLogout}>Log out</button>
      </div>
    </header>
  );
}
