export const STORAGE_KEY = 'growsim.v1.state';

export function createInitialState() {
  const now = Date.now();
  return {
    version: 1,
    runStartedAt: now,
    lastTickAt: now,
    dayStamp: new Date(now).toDateString(),
    uiState: 'normal',
    plantStage: 'seedling',
    analysisUnlocked: false,
    adViewsToday: 0,
    stats: {
      health: 0.82,
      stress: 0.22,
      water: 0.75,
      nutrition: 0.7,
      growth: 0.08,
      risk: 0.16
    },
    history: [],
    currentEvent: null
  };
}

export function clamp01(v) {
  return Math.max(0, Math.min(1, v));
}

export function computeUiState(stats) {
  const warning = stats.risk > 0.6 || stats.water < 0.3 || stats.nutrition < 0.3 || stats.stress > 0.7;
  const critical = stats.health < 0.25 || stats.stress > 0.9 || stats.risk > 0.85;
  if (critical) return 'critical';
  if (warning) return 'warning';
  return 'normal';
}
