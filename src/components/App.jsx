// Auth gate: the login page until someone is signed in, then their calendar.
// Signing in and the list of users both come from the API.
function App() {
  const [session, setSession] = React.useState(null);              // { user, users } once signed in
  const [checking, setChecking] = React.useState(() => !!getToken()); // a token from this tab is being checked
  const [notice, setNotice] = React.useState("");                  // why the login page is showing, if not just "signed out"

  const start = (user, users) => {
    // Entries saved before accounts existed have no owner: the first user in the list adopts them.
    if (users.length && user.id === Math.min(...users.map((u) => u.id))) adoptLegacyEntries(user.username);
    setNotice("");
    setSession({ user, users });
  };

  // A page reload keeps the tab's token: check it with the API, and get the user list.
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
        const users = await loadUsers();
        if (!cancelled && user) start(user, users);
      } catch (e) {
        if (!cancelled && e.status !== 401) setNotice(e.message); // a 401 already said "session ended"
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Resolves with null on success, or the reason it failed (shown on the login page).
  const login = async (username, password) => {
    const result = await loginUser(username, password);
    if (!result.ok) return result.error;
    clearView();                                    // a new sign-in starts on today's month
    start(result.user, await loadUsers());
    return null;
  };

  const logout = async () => {
    clearView();
    setSession(null);
    setNotice("");
    await logoutUser();
  };

  if (checking) {
    return <><div className="auth-page"><p className="auth-note">Checking your session…</p></div><StatusBar /></>;
  }
  if (!session) return <><LoginPage onLogin={login} notice={notice} /><StatusBar /></>;
  // key: a different user always gets a fresh calendar (month, selection, open dialogs).
  return (
    <>
      <CalendarApp
        key={session.user.id}
        user={session.user.username}
        profile={session.user}
        users={session.users}
        onLogout={logout}
      />
      <StatusBar />
    </>
  );
}
