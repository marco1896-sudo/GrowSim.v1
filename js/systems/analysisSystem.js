export function getAnalysisSnapshot(state) {
  const s = state.stats;
  const hydration = Math.round(s.water * 100);
  const nutrition = Math.round(s.nutrition * 100);
  const resilience = Math.round((s.health - s.stress * 0.45 + s.growth * 0.25) * 100);
  return {
    hydration,
    nutrition,
    resilience,
    recommendation: s.risk > 0.6 ? 'Sofort Wasser + Nährstoffe priorisieren.' : 'Stabil. Weiter beobachten.'
  };
}
