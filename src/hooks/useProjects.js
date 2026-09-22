// The "Customer - Project" choices, read from the API (plain script, no JSX).
// Only active projects of active customers, the signed-in user's favorites first (GET /projects/options).
// Each project is { id, label, is_favorite, ... }; entries are saved with the label.
//
// Returns { projects, status, error, reload }: status is "loading", "ready" or "error" (error is then the reason).
function useProjects() {
  const [state, setState] = React.useState({ projects: [], status: "loading", error: "" });

  const load = React.useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: "" }));
    try {
      setState({ projects: await apiProjectOptions(), status: "ready", error: "" });
    } catch (e) {
      setState({ projects: [], status: "error", error: e.message });
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return { ...state, reload: load };
}
