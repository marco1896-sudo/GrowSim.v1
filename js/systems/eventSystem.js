import { rand } from '../core/rng.js';
import { clamp100 } from '../core/state.js';

const SUPPORTED_OPS = new Set(['<', '<=', '>', '>=', '==', '!=']);
const EVENT_ROLL_INTERVAL_MIN = 10;
const EVENT_COOLDOWN_MIN = 20;

export function getByPath(obj, path) {
  if (!obj || typeof path !== 'string' || !path) return undefined;
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

export function setByPath(obj, path, value) {
  if (!obj || typeof path !== 'string' || !path) return false;
  const keys = path.split('.');
  let cursor = obj;
  for (let i = 0; i < keys.length - 1; i += 1) {
    const key = keys[i];
    if (typeof cursor[key] !== 'object' || cursor[key] === null) cursor[key] = {};
    cursor = cursor[key];
  }
  cursor[keys[keys.length - 1]] = value;
  return true;
}

function resolveStatePath(state, field) {
  if (field.includes('.')) return field;
  if (Object.hasOwn(state.stats, field)) return `stats.${field}`;
  return field;
}

function normalizeChance(value, fallback = 0.12) {
  if (typeof value !== 'number') return fallback;
  if (value > 1) return Math.max(0, Math.min(1, value / 100));
  return Math.max(0, Math.min(1, value));
}

function normalizeDurationHours(value, fallback = 0) {
  if (typeof value !== 'number') return fallback;
  return Math.max(0, value);
}

function normalizeEvent(raw) {
  const id = raw.eventId || raw.id || `event-${Math.floor(rand() * 1_000_000)}`;
  const title = raw.title || 'Unbenanntes Ereignis';
  const description = raw.text || raw.description || raw.body || '';
  const condition = raw.condition || { all: [], any: [] };

  const actionsSrc = raw.choices || raw.actions || [];
  const actions = actionsSrc.map((a, idx) => ({
    id: a.id || `choice-${idx}`,
    label: a.label || `Aktion ${idx + 1}`,
    effects: a.effects || {},
    resolvesEvent: a.resolvesEvent !== false,
    delayed: Array.isArray(a.delayed) ? a.delayed : []
  }));

  return {
    id,
    title,
    description,
    chancePerHour: normalizeChance(raw.chancePerHour, 0.12),
    durationHours: normalizeDurationHours(raw.durationHours, 0),
    effectsPerMinute: raw.effectsPerMinute || {},
    condition,
    actions
  };
}

export function evalRule(state, rule) {
  if (!rule || typeof rule !== 'object') return true;
  const { field, op, value } = rule;
  if (!field || !SUPPORTED_OPS.has(op)) return false;
  const left = getByPath(state, resolveStatePath(state, field));
  switch (op) {
    case '<': return left < value;
    case '<=': return left <= value;
    case '>': return left > value;
    case '>=': return left >= value;
    case '==': return left === value;
    case '!=': return left !== value;
    default: return false;
  }
}

export function evalCondition(state, cond) {
  if (!cond) return true;
  const all = Array.isArray(cond.all) ? cond.all : [];
  const any = Array.isArray(cond.any) ? cond.any : [];
  return all.every((rule) => evalRule(state, rule)) && (any.length === 0 || any.some((rule) => evalRule(state, rule)));
}

export function applyPatch(state, patch = {}) {
  Object.entries(patch).forEach(([field, delta]) => {
    const path = resolveStatePath(state, field);
    const current = getByPath(state, path);

    if (typeof current === 'number' && typeof delta === 'number') {
      setByPath(state, path, clamp100(current + delta));
      return;
    }

    if (typeof current === 'boolean' && typeof delta === 'boolean') {
      setByPath(state, path, delta);
    }
  });
}

function queueDelayedEffects(state, delayed = []) {
  delayed.forEach((item) => {
    if (typeof item?.inMin !== 'number' || !item.effects) return;
    state.pendingEffects.push({
      inMin: item.inMin,
      effects: item.effects
    });
  });
}

export function tickDelayedQueue(state, minutes = 1) {
  if (!Array.isArray(state.pendingEffects) || state.pendingEffects.length === 0) return;
  state.pendingEffects.forEach((item) => {
    item.inMin -= minutes;
  });
  const due = state.pendingEffects.filter((item) => item.inMin <= 0);
  due.forEach((item) => applyPatch(state, item.effects));
  state.pendingEffects = state.pendingEffects.filter((item) => item.inMin > 0);
}

export async function loadEvents() {
  const primary = await fetch('./data/events.json').catch(() => null);
  const fallback = primary?.ok ? null : await fetch('./events.json').catch(() => null);
  const res = primary?.ok ? primary : fallback;
  if (!res?.ok) throw new Error('Events konnten nicht geladen werden');
  const raw = await res.json();
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeEvent);
}

function chooseCandidate(candidates) {
  if (!candidates.length) return null;
  const idx = Math.floor(rand() * candidates.length);
  return candidates[idx];
}

export function maybeTriggerEvent(state, events) {
  if (state.currentEvent || state.activeEvent) return;
  if (!Array.isArray(events) || events.length === 0) return;
  if (state.eventCooldownMin > 0) return;

  state.minutesSinceLastEventRoll += 1;
  if (state.minutesSinceLastEventRoll < EVENT_ROLL_INTERVAL_MIN) return;
  state.minutesSinceLastEventRoll = 0;

  const candidates = [];
  events.forEach((event) => {
    if (!evalCondition(state, event.condition)) return;
    const effectiveChance = event.chancePerHour * (EVENT_ROLL_INTERVAL_MIN / 60);
    if (rand() < effectiveChance) candidates.push(event);
  });

  const picked = chooseCandidate(candidates.filter((e) => e.id !== state.lastEventId)) || chooseCandidate(candidates);
  if (!picked) return;

  state.currentEvent = picked;
  state.eventCooldownMin = EVENT_COOLDOWN_MIN;
  state.lastEventId = picked.id;
  state.history.unshift({ t: Date.now(), type: 'event', label: `Event triggered: ${picked.title}` });
  state.history = state.history.slice(0, 20);
  state.telemetry.push(JSON.stringify({ t: Date.now(), type: 'event_triggered', eventId: picked.id }));

  if (picked.durationHours > 0) {
    state.activeEvent = {
      eventId: picked.id,
      title: picked.title,
      remainingMinutes: Math.round(picked.durationHours * 60),
      effectsPerMinute: picked.effectsPerMinute || {}
    };
  }
}

export function tickActiveEvent(state, minutes = 1) {
  if (!state.activeEvent) return;
  applyPatch(state, state.activeEvent.effectsPerMinute || {});
  state.activeEvent.remainingMinutes -= minutes;
  if (state.activeEvent.remainingMinutes <= 0) {
    state.history.unshift({ t: Date.now(), type: 'event', label: `Event resolved: ${state.activeEvent.eventId}` });
    state.history = state.history.slice(0, 20);
    state.telemetry.push(JSON.stringify({ t: Date.now(), type: 'event_resolved', eventId: state.activeEvent.eventId, reason: 'duration_end' }));
    state.activeEvent = null;
  }
}

function patchSummary(effects = {}) {
  return Object.entries(effects)
    .filter(([, v]) => typeof v === 'number' || typeof v === 'boolean')
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');
}

export function resolveEventAction(state, actionId) {
  if (!state.currentEvent) return;
  const action = state.currentEvent.actions.find((item) => item.id === actionId);
  if (!action) return;

  applyPatch(state, action.effects);
  queueDelayedEffects(state, action.delayed);

  state.history.unshift({
    t: Date.now(),
    type: 'event',
    label: `Action: ${action.label} (${patchSummary(action.effects)})`
  });
  state.history = state.history.slice(0, 20);
  state.telemetry.push(JSON.stringify({ t: Date.now(), type: 'event_action', eventId: state.currentEvent.id, actionId }));

  const shouldResolve = action.resolvesEvent !== false;
  const activeForCurrent = state.activeEvent?.eventId === state.currentEvent.id;
  if (shouldResolve && activeForCurrent) {
    state.activeEvent = null;
  }
  if (shouldResolve || !activeForCurrent) {
    state.history.unshift({ t: Date.now(), type: 'event', label: `Event resolved: ${state.currentEvent.id}` });
    state.history = state.history.slice(0, 20);
    state.telemetry.push(JSON.stringify({ t: Date.now(), type: 'event_resolved', eventId: state.currentEvent.id, reason: 'action' }));
  }

  state.currentEvent = null;
}
