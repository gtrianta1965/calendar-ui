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

// UI_VERSION (src/config.js) is bumped by hand. A config.js that does not define it yet just shows no version,
// instead of failing on an undefined name.
const uiVersion = () => (typeof UI_VERSION !== "undefined" ? UI_VERSION : "");

function StatusBar() {
  const env = apiEnvironment();
  const version = uiVersion();
  return (
    <div className="status-bar" title={API_BASE_URL}>
      API: <strong>{env.label}</strong> <span className="status-bar-host">{env.host}</span>
      {version && <span className="status-bar-version"> · UI <strong>v{version}</strong></span>}
    </div>
  );
}
