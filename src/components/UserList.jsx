// Everyone in the user directory, each in their own color, with a checkbox: the calendar shows the entries of the
// checked users only. The users are drawn in one box per technology group (DBA, MW, SEC - `users[].technology_group`,
// and a last box, "Unassigned", for the ones without a group), in the order of TECH_GROUPS. Each box has a checkbox of
// its own that checks or unchecks the whole group (a dash when only some of its users are checked).
// `meId` marks the signed-in user, `shown` is the list of checked user ids and `onToggle(id)` checks or unchecks one;
// `onToggleGroup(ids, on)` checks (`on`) or unchecks a whole group at once. Deactivated users are listed too (their old
// entries can still be read), and marked. `allShown` is true once every listed user is checked; `onToggleAll` checks
// everyone, or (once `allShown`) unchecks everyone - the button at the end of the row.
const TECH_GROUPS = [
  { key: "DBA", label: "DBA", title: "Database" },
  { key: "MW", label: "MW", title: "Middleware" },
  { key: "SEC", label: "SEC", title: "Security" },
];
const NO_GROUP = { key: "", label: "Unassigned", title: "No technology group" };

// Position of a user's group in the list above (an unknown or missing group sorts last): for ordering users so the
// calendar's other views (the pivot's columns) follow the same order as the boxes.
function techGroupRank(user) {
  const i = TECH_GROUPS.findIndex((g) => g.key === user.technology_group);
  return i === -1 ? TECH_GROUPS.length : i;
}

// A checkbox that can show the "some of them" dash, which only the DOM property `indeterminate` can set.
function GroupCheckbox({ checked, indeterminate, onChange, label }) {
  const ref = React.useRef(null);
  React.useEffect(() => { if (ref.current) ref.current.indeterminate = indeterminate; }, [indeterminate]);
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={label} />;
}

function UserList({ users, meId, shown, onToggle, onToggleGroup, allShown, onToggleAll }) {
  if (users.length === 0) return null;
  const groups = [...TECH_GROUPS, NO_GROUP]
    .map((g) => ({ ...g, members: users.filter((u) => (g.key ? u.technology_group === g.key : techGroupRank(u) === TECH_GROUPS.length)) }))
    .filter((g) => g.members.length > 0);
  return (
    <div className="user-groups" aria-label="Show entries of">
      {groups.map((g) => {
        const checkedCount = g.members.filter((u) => shown.includes(u.id)).length;
        const all = checkedCount === g.members.length;
        return (
          <fieldset key={g.key || "none"} className="user-group">
            <legend title={g.title}>
              <label>
                <GroupCheckbox
                  checked={all}
                  indeterminate={checkedCount > 0 && !all}
                  onChange={() => onToggleGroup(g.members.map((u) => u.id), !all)}
                  label={`Show all ${g.title} users`}
                />
                {g.label}
              </label>
            </legend>
            <ul className="user-list">
              {g.members.map((u) => (
                <li key={u.id} className={u.id === meId ? "me" : undefined} title={u.username}>
                  <label>
                    <input type="checkbox" checked={shown.includes(u.id)} onChange={() => onToggle(u.id)} />
                    <span className="user-dot" style={{ background: u.color }} />
                    {u.full_name || u.username}
                    {!u.is_active && <span className="inactive"> (inactive)</span>}
                  </label>
                </li>
              ))}
            </ul>
          </fieldset>
        );
      })}
      <button type="button" className="select-all" onClick={onToggleAll}>
        {allShown ? "Deselect All" : "Select All"}
      </button>
    </div>
  );
}
