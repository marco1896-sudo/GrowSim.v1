export const STORAGE_KEY = 'growsim.v1.state';

export function createInitialState() {
  const now = Date.now();
  return {
    version: 2,
    runStartedAt: now,
    lastTickAt: now,
    simMinutes: 0,
    pausedReasons: {},
    uiState: 'normal',
    plantStage: 'seedling',
    analysisUnlocked: false,
    adViewsToday: 0,
    adDayStamp: new Date(now).toISOString().slice(0, 10),
    lastEventId: null,
    eventCooldownMin: 0,
    minutesSinceLastEventRoll: 0,
    lastEventId: null,
    nextEventAt: 0,
    eventCooldownUntil: 0,
    pendingEffects: [],
    flags: {
      saltBuildUp: false
    },
    telemetry: [],
    stats: {
      health: 82,
      stress: 22,
      water: 75,
      nutrition: 70,
      growth: 8,
      risk: 16
    },
    history: [],
    currentEvent: null,
    activeEvent: null
  };
}

export function clamp100(v) {
  return Math.max(0, Math.min(100, v));
}

export function computeUiState(stats) {
  const warning = stats.risk > 60 || stats.water < 30 || stats.nutrition < 30 || stats.stress > 70;
  const critical = stats.health < 25 || stats.stress > 90 || stats.risk > 85;
  if (critical) return 'critical';
  if (warning) return 'warning';
  return 'normal';
}
