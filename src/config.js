// Settings you are expected to edit: where the API is, and the choices offered
// when adding an entry. Plain script, exposes globals.

// Where the API listens. Sign-in and the list of users come from it. No trailing slash.
// The API is Oracle REST Data Services (ORDS), the PL/SQL services of ords/ords.sql. It is now the one on the Oracle
// Autonomous Database (see "The same backend on Oracle Autonomous Database" in ords/ords.md); it answers a page from any origin.
const API_BASE_URL = "https://sbef1gj6zmj6uhq-dbg30.adb.eu-frankfurt-1.oraclecloudapps.com/ords/gtrianta/calendar";
// The same services on the local Oracle database (start ORDS as described in ords/ords.md); to use it instead,
// comment the line above and uncomment this one (ORDS accepts pages served from any localhost port):
// const API_BASE_URL = "http://localhost:8080/ords/gtrianta/calendar";
// The FastAPI backend (startserver.bat, SQLite) answers exactly the same requests; to use it instead,
// comment the line above and uncomment this one (see backend/README.md for its CORS settings):
// const API_BASE_URL = "http://127.0.0.1:8000/api";

// NOT USED BY THE APP ANY MORE: it signs in, and lists users, through the API. These are only the usernames
// db/create_db.py creates in a NEW database. There are no passwords here (this file is served to the browser as
// plain text): create_db.py takes the starting password of these accounts from its --password option, from the
// CALENDAR_SEED_PASSWORD environment variable, or asks for it, and hashes it before it is stored.
const USERS = [
  { username: "alice" },
  { username: "bob" },
  { username: "gtrianta" }
];

// NOT USED BY THE APP ANY MORE: the customer-project choices come from the API (GET /projects/options). This list is
// only the starting data that db/create_db.py loads into a NEW database; "Customer - Project" is split on the first " - ".
const PROJECTS = [
  "Acme Corp - Website Redesign",
  "Acme Corp - Mobile App",
  "Globex - Data Migration",
  "Globex - Support",
  "Initech - Internal Tools",
  "Internal - Administration",
  "OPAP - ExaCC Migrations"
];

// Hours per entry: 0.5 to 12 in half-hour steps.
const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => (i + 1) / 2);

// Hours preselected when adding a new entry.
const DEFAULT_HOURS = 8;

// Technology groups offered by the administrator's user editor. The trailing separator leaves room for
// an empty option, which clears an existing assignment because the Oracle column is nullable.
const TECHNOLOGY_GROUP_LIST = "DBA|MW|SEC|";
