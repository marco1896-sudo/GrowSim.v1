import { STORAGE_KEY, createInitialState } from './state.js';

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
  return merged;
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createInitialState();
    const parsed = JSON.parse(raw);
    if (parsed?.version !== 1) return createInitialState();
    return normalizeState(parsed);
  } catch {
    return createInitialState();
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
