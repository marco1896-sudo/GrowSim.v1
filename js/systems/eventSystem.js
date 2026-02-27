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

const SUPPORTED_OPS = new Set(['<', '<=', '>', '>=', '==', '!=']);
const EVENT_INTERVAL_MIN_MS = 30 * 1000;
const EVENT_INTERVAL_MAX_MS = 60 * 1000;

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

function readFieldValue(state, field) {
  const path = resolveStatePath(state, field);
  const val = getByPath(state, path);
  if (path.startsWith('stats.') && typeof val === 'number') return val * 100;
  return val;
}

function scheduleNextEvent(state, now = Date.now()) {
  const jitter = EVENT_INTERVAL_MIN_MS + Math.floor(rand() * (EVENT_INTERVAL_MAX_MS - EVENT_INTERVAL_MIN_MS + 1));
  state.nextEventAt = now + jitter;
}

export function evalRule(state, rule) {
  if (!rule || typeof rule !== 'object') return true;
  const { field, op, value } = rule;
  if (!field || !SUPPORTED_OPS.has(op)) return false;
  const left = readFieldValue(state, field);
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
  const allOk = all.every((rule) => evalRule(state, rule));
  const anyOk = any.length === 0 || any.some((rule) => evalRule(state, rule));
  return allOk && anyOk;
}

export function applyPatch(state, patch = {}) {
  Object.entries(patch).forEach(([field, delta]) => {
    const path = resolveStatePath(state, field);
    const current = getByPath(state, path);

    if (typeof current === 'number' && typeof delta === 'number') {
      if (path.startsWith('stats.')) {
        const next = Math.max(0, Math.min(100, current * 100 + delta));
        setByPath(state, path, next / 100);
      } else {
        const next = Math.max(0, Math.min(100, current + delta));
        setByPath(state, path, next);
      }
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
      at: Date.now() + item.inMin * 60 * 1000,
      effects: item.effects
    });
  });
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
  const res = await fetch('./events.json');
  if (!res.ok) throw new Error(`Events konnten nicht geladen werden (${res.status})`);
  return res.json();
}

export function maybeTriggerEvent(state, events) {
  if (state.currentEvent) return;

  const now = Date.now();
  if (typeof state.nextEventAt !== 'number' || state.nextEventAt <= 0) {
    scheduleNextEvent(state, now);
    return;
  }

  if (now < state.nextEventAt) return;

  const eligible = events.filter((event) => evalCondition(state, event.condition));
  if (!eligible.length) {
    scheduleNextEvent(state, now);
    return;
  }
  if (Date.now() < state.eventCooldownUntil) return;

  const eligible = events.filter((event) => evalCondition(state, event.condition));
  if (!eligible.length) return;

  const filtered = eligible.filter((event) => event.eventId !== state.lastEventId);
  const pool = filtered.length ? filtered : eligible;

  const chance = 0.05 + state.stats.risk * 0.09;
  if (rand() > chance) return;

  const idx = Math.floor(rand() * pool.length);
  state.currentEvent = pool[idx];
}

export function resolveEventAction(state, choiceId) {
  if (!state.currentEvent) return;
  const picked = state.currentEvent.choices.find((choice) => choice.id === choiceId);
  if (!picked) return;

  applyPatch(state, picked.effects);
  queueDelayedEffects(state, picked.delayed);

  const now = Date.now();
  state.lastEventId = state.currentEvent.eventId;
  scheduleNextEvent(state, now);
  state.eventCooldownUntil = now + 45 * 60 * 1000;

  state.history.unshift({ t: now, type: 'event', label: `${state.currentEvent.title}: ${picked.label}` });
  state.history = state.history.slice(0, 20);
  state.telemetry.push(JSON.stringify({ t: now, type: 'event', eventId: state.currentEvent.eventId, choiceId }));

  state.currentEvent = null;
}

export function applyDueDelayedEffects(state, now = Date.now()) {
  const due = state.pendingEffects.filter((item) => item.at <= now);
  if (!due.length) return;
  due.forEach((item) => applyPatch(state, item.effects));
  state.pendingEffects = state.pendingEffects.filter((item) => item.at > now);
}
