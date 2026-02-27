import { rand } from '../core/rng.js';

export async function loadEvents() {
  const res = await fetch('./data/events.json');
  return res.json();
}

export function maybeTriggerEvent(state, events) {
  if (state.currentEvent) return;
  const chance = 0.055 + state.stats.risk * 0.08;
  if (rand() > chance) return;
  const idx = Math.floor(rand() * events.length);
  state.currentEvent = events[idx];
}

export function resolveEventAction(state, action) {
  if (!state.currentEvent) return;
  const picked = state.currentEvent.actions.find((a) => a.id === action);
  if (!picked) return;
  state.stats.health = Math.max(0, Math.min(1, state.stats.health + (picked.effects.health ?? 0)));
  state.stats.stress = Math.max(0, Math.min(1, state.stats.stress + (picked.effects.stress ?? 0)));
  state.stats.water = Math.max(0, Math.min(1, state.stats.water + (picked.effects.water ?? 0)));
  state.stats.nutrition = Math.max(0, Math.min(1, state.stats.nutrition + (picked.effects.nutrition ?? 0)));
  state.stats.risk = Math.max(0, Math.min(1, state.stats.risk + (picked.effects.risk ?? 0)));
  state.history.unshift({ t: Date.now(), type: 'event', label: `${state.currentEvent.title}: ${picked.label}` });
  state.history = state.history.slice(0, 20);
  state.currentEvent = null;
}
