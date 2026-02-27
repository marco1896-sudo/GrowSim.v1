import { STORAGE_KEY, createInitialState, clamp100 } from './state.js';

function normalizeStats(stats = {}, baseStats) {
  const merged = { ...baseStats, ...stats };
  const needsScale = Object.values(merged).every((v) => typeof v === 'number' && v <= 1.2);
  if (needsScale) {
    Object.keys(merged).forEach((k) => {
      if (typeof merged[k] === 'number') merged[k] = clamp100(merged[k] * 100);
    });
    return merged;
  }
  Object.keys(merged).forEach((k) => {
    if (typeof merged[k] === 'number') merged[k] = clamp100(merged[k]);
  });
  return merged;
}

function normalizeState(parsed) {
  const base = createInitialState();
  const merged = {
    ...base,
    ...parsed,
    flags: { ...base.flags, ...(parsed.flags || {}) }
  };

  merged.stats = normalizeStats(parsed.stats, base.stats);
  if (!Array.isArray(merged.pendingEffects)) merged.pendingEffects = [];
  if (!Array.isArray(merged.telemetry)) merged.telemetry = [];
  if (!Array.isArray(merged.history)) merged.history = [];
  if (!merged.pausedReasons || typeof merged.pausedReasons !== 'object') merged.pausedReasons = {};
  if (typeof merged.eventCooldownMin !== 'number') merged.eventCooldownMin = 0;
  if (typeof merged.minutesSinceLastEventRoll !== 'number') merged.minutesSinceLastEventRoll = 0;
  if (typeof merged.simMinutes !== 'number') merged.simMinutes = 0;
  if (typeof merged.adDayStamp !== 'string') merged.adDayStamp = base.adDayStamp;

  return merged;
}

function normalizeState(parsed) {
  const base = createInitialState();
  const merged = {
    ...base,
    ...parsed,
    flags: { ...base.flags, ...(parsed.flags || {}) },
    stats: { ...base.stats, ...(parsed.stats || {}) }
  };
  if (!Array.isArray(merged.pendingEffects)) merged.pendingEffects = [];
  if (!Array.isArray(merged.telemetry)) merged.telemetry = [];
  if (typeof merged.nextEventAt !== 'number') merged.nextEventAt = 0;
  return merged;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return createInitialState();
    if (parsed?.version !== 1) return createInitialState();
    return normalizeState(parsed);
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
