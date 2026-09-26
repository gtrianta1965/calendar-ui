// Public holidays, by date - loaded once (GET /public-holidays, open to any signed-in user; see ords/ords.md).
// Grouped by date because the same date can be a holiday in more than one country (Greece and Cyprus share
// several) - the calendar shows one banner per cell, not one per country.
//
// Returns { byDate, status, error, reload }. byDate maps a 'YYYY-MM-DD' key to { description, countries }:
// countries is every country that date is a holiday in, comma-joined in the API's own order; description is
// Greece's own description when Greece is among them (the shared convention for a date both countries observe),
// otherwise the first country's.
function useHolidays() {
  const [state, setState] = React.useState({ byDate: {}, status: "loading", error: "" });

  const load = React.useCallback(async () => {
    setState((s) => ({ ...s, status: "loading", error: "" }));
    try {
      const rows = await apiPublicHolidays();
      const byCountryDate = {};
      for (const h of rows) {
        (byCountryDate[h.holiday_date] || (byCountryDate[h.holiday_date] = [])).push(h);
      }
      const byDate = {};
      for (const [date, list] of Object.entries(byCountryDate)) {
        const greek = list.find((h) => h.country === "Greece");
        byDate[date] = { description: (greek || list[0]).description, countries: list.map((h) => h.country).join(", ") };
      }
      setState({ byDate, status: "ready", error: "" });
    } catch (e) {
      setState({ byDate: {}, status: "error", error: e.message });
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  return { ...state, reload: load };
}
