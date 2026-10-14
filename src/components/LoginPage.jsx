// `onLogin(username, password)` resolves with null on success, or the reason it failed.
// `notice`: why we are back here (for example an expired session), shown until the next attempt.
function LoginPage({ onLogin, notice }) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const failure = await onLogin(username, password);
    if (failure) {
      setError(failure);
      setBusy(false);
    } // on success this page is replaced by the calendar
  };

  const message = error || notice;

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <BrandMark size={52} />
        <div className="brand-name">Oracle Consulting Calendar</div>
      </div>
      <form className="auth-card" onSubmit={submit}>
        <h1>Sign in</h1>
        <p className="auth-lead">Enter your account details to continue.</p>

        <label className="field">
          <span>Username</span>
          <input
            type="text"
            value={username}
            autoFocus
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <label className="field">
          <span>Password</span>
          <input
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {message && <p className="auth-error" role="alert">{message}</p>}

        <button className="primary" type="submit" disabled={!username || !password || busy}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="auth-try">
        <span className="auth-try-badge">New</span>
        <p>
          We have a new calendar built with Oracle APEX.{" "}
          <a
            href="https://sbef1gj6zmj6uhq-dbg30.adb.eu-frankfurt-1.oraclecloudapps.com/ords/r/gtrianta/calendar"
            target="_blank"
            rel="noopener noreferrer"
          >
            Try it out &rarr;
          </a>
        </p>
      </div>
    </div>
  );
}
