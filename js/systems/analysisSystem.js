import { clamp100 } from '../core/state.js';

export function computeRisk(state) {
  const s = state.stats;
  let risk = 0;
  if (s.water < 25) risk += 40;
  if (s.nutrition < 25) risk += 40;
  if (s.stress > 75) risk += 30;
  if (s.health < 35) risk += 30;
  if (state.activeEvent || state.currentEvent) risk += 20;
  return clamp100(risk);
}

export function getDiagnosis(state) {
  const s = state.stats;
  const risk = computeRisk(state);
  if (s.health < 25) return 'Critical health collapse';
  if (s.water < 25) return 'Drought stress';
  if (s.nutrition < 25) return 'Nutrient deficiency';
  if (s.stress > 80) return 'High stress load';
  if (risk > 60) return 'Rising risk factors';
  return 'Stable';
}

export function getRecommendations(state) {
  const s = state.stats;
  const rec = [];
  if (s.water < 30) rec.push('Wasser priorisieren und Drain kontrollieren.');
  if (s.nutrition < 30) rec.push('Nährstoffgabe in kleiner Dosis ergänzen.');
  if (s.stress > 75) rec.push('Stress senken: Klima beruhigen und Eingriffe reduzieren.');
  if (s.health < 35) rec.push('Rettungsmodus: Stabilisierung vor Wachstum.');
  if (rec.length === 0) rec.push('Stabil: Routine beibehalten und weiter beobachten.');
  return rec.slice(0, 3);
}

export function getAnalysisSnapshot(state) {
  const s = state.stats;
  const risk = computeRisk(state);
  return {
    hydration: Math.round(s.water),
    nutrition: Math.round(s.nutrition),
    resilience: Math.round(clamp100(s.health - s.stress * 0.45 + s.growth * 0.25)),
    risk,
    diagnosis: getDiagnosis(state),
    recommendations: getRecommendations(state)
  };
}
