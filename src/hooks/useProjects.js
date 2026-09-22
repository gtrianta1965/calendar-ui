// The "Customer - Project" choices, read from the API (plain script, no JSX).
// Only active projects of active customers, one user's favorites first (GET /projects/options).
// forUserId: whose favorites go first, or undefined/null for the signed-in user (the API's own default).
// Reloads whenever forUserId changes, so the order can follow whoever an entry is being made for.
// Each project is { id, label, is_favorite, ... }; entries are saved with the label.
//
// Returns { projects, status, error, reload }: status is "loading", "ready" or "error" (error is then the reason).
function useProjects(forUserId) {
  const [state, setState] = React.useState({ projects: [], status: "loading", error: "" });

  const load = React.useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: "" }));
    try {
      setState({ projects: await apiProjectOptions(forUserId), status: "ready", error: "" });
    } catch (e) {
      setState({ projects: [], status: "error", error: e.message });
    }
  }, [forUserId]);

  React.useEffect(() => { load(); }, [load]);

  return { ...state, reload: load };
}
