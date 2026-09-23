// Auth gate + navigation for the admin console. Reuses LoginPage.jsx and the sign-in/session helpers from
// ../../../src/utils/auth.js and api.js exactly as the main app does (same backend, same bearer token) -
// nothing about signing in is admin-specific, so nothing about it is duplicated here.
function AdminApp() {
  const [session, setSession] = React.useState(null);         // the signed-in user, or null
  const [checking, setChecking] = React.useState(() => !!getToken());
  const [notice, setNotice] = React.useState("");
  const [tab, setTab] = React.useState("users");
  const [customersVersion, setCustomersVersion] = React.useState(0);

  React.useEffect(() => {
    setUnauthorizedHandler(() => {
      setSession(null);
      setNotice("Your session has ended. Please sign in again.");
    });
    if (!getToken()) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const user = await restoreSession();
        if (!cancelled && user) { setNotice(""); setSession(user); }
      } catch (e) {
        if (!cancelled && e.status !== 401) setNotice(e.message);
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const login = async (username, password) => {
    const result = await loginUser(username, password);
    if (!result.ok) return result.error;
    setNotice("");
    setSession(result.user);
    return null;
  };

  const logout = async () => {
    setSession(null);
    setNotice("");
    await logoutUser();
  };

  if (checking) {
    return <><div className="auth-page"><p className="auth-note">Checking your session…</p></div><StatusBar /></>;
  }
  if (!session) return <><LoginPage onLogin={login} notice={notice} /><StatusBar /></>;

  if (session.role !== "admin") {
    return (
      <>
        <div className="auth-page">
          <div className="auth-card">
            <h1>Administrators only</h1>
            <p>{session.full_name || session.username} is signed in, but this console needs an administrator.</p>
            <button className="primary" onClick={logout}>Sign in as someone else</button>
          </div>
        </div>
        <StatusBar />
      </>
    );
  }

  const TABS = [
    { id: "users", label: "Users" },
    { id: "customers", label: "Customers" },
    { id: "projects", label: "Projects" },
    { id: "favorites", label: "Favorites" },
    { id: "export", label: "Export" },
  ];

  return (
    <div className="app">
      <div className="header">
        <h1>Calendar Admin</h1>
        <span className="user">
          Signed in as <strong>{session.full_name || session.username}</strong>
          <span className="role"> (admin)</span>
        </span>
        <a className="button" href="../index.html" title="Back to the calendar">
          Calendar
        </a>
        <button onClick={logout}>Log out</button>
      </div>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? "tab active" : "tab"} onClick={() => setTab(t.id)}>{t.label}</button>
        ))}
      </nav>
      {tab === "users" && <UsersAdmin />}
      {tab === "customers" && <CustomersAdmin onChanged={() => setCustomersVersion((v) => v + 1)} />}
      {tab === "projects" && <ProjectsAdmin customersVersion={customersVersion} />}
      {tab === "favorites" && <FavoritesAdmin />}
      {tab === "export" && <ExportAdmin />}
      <StatusBar />
    </div>
  );
}
