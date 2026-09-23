// Everyone in the user directory, each in their own color, with a checkbox: the calendar shows the entries of the
// checked users only. `meId` marks the signed-in user, `shown` is the list of checked user ids and
// `onToggle(id)` checks or unchecks one. Deactivated users are listed too (their old entries can still be read),
// and marked. `allShown` is true once every listed user is checked; `onToggleAll` checks everyone, or (once
// `allShown`) unchecks everyone - the button at the end of the row.
function UserList({ users, meId, shown, onToggle, allShown, onToggleAll }) {
  if (users.length === 0) return null;
  return (
    <ul className="user-list" aria-label="Show entries of">
      {users.map((u) => (
        <li key={u.id} className={u.id === meId ? "me" : undefined} title={u.username}>
          <label>
            <input type="checkbox" checked={shown.includes(u.id)} onChange={() => onToggle(u.id)} />
            <span className="user-dot" style={{ background: u.color }} />
            {u.full_name || u.username}
            {!u.is_active && <span className="inactive"> (inactive)</span>}
          </label>
        </li>
      ))}
      <li>
        <button type="button" className="select-all" onClick={onToggleAll}>
          {allShown ? "Deselect All" : "Select All"}
        </button>
      </li>
    </ul>
  );
}
