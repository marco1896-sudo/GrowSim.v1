import { rand } from '../core/rng.js';

const SUPPORTED_OPS = new Set(['<', '<=', '>', '>=', '==', '!=']);

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
  const res = await fetch('./events.json');
  if (!res.ok) throw new Error(`Events konnten nicht geladen werden (${res.status})`);
  return res.json();
}

export function maybeTriggerEvent(state, events) {
  if (state.currentEvent) return;
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
