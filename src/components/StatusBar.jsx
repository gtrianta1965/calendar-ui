// A slim bar fixed to the bottom of the page, naming which API this page is talking to. Handy while switching
// between the local Oracle database and the Autonomous one (or FastAPI): API_BASE_URL (src/config.js) is the
// only thing that ever changes between them, so this reads it, not something set separately that could drift.
// Shared by both front ends (the calendar and the admin console) - see admin/index.html.
function apiEnvironment() {
  let host;
  try {
    host = new URL(API_BASE_URL).host;
  } catch (e) {
    return { label: "API", host: String(API_BASE_URL) };
  }
  if (host === "localhost:8080" || host === "127.0.0.1:8080") return { label: "Local Oracle (ORDS)", host };
  if (/(^|\.)oraclecloudapps\.com$/.test(host)) return { label: "Oracle Autonomous Database", host };
  if (host === "localhost:8000" || host === "127.0.0.1:8000") return { label: "FastAPI / SQLite", host };
  return { label: "API", host };
}

function StatusBar() {
  const env = apiEnvironment();
  return (
    <div className="status-bar" title={API_BASE_URL}>
      API: <strong>{env.label}</strong> <span className="status-bar-host">{env.host}</span>
    </div>
  );
}
