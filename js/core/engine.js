import { computeUiState, createInitialState } from './state.js';
import { tickPlant } from '../systems/plantSystem.js';
import {
  maybeTriggerEvent,
  tickActiveEvent,
  tickDelayedQueue
} from '../systems/eventSystem.js';
import { resetAdsOnNewDay } from '../systems/adSystem.js';
import { computeRisk } from '../systems/analysisSystem.js';

export function pauseEngine(state, reason) {
  if (!reason) return;
  state.pausedReasons[reason] = true;
}

export function resumeEngine(state, reason) {
  if (!reason) return;
  delete state.pausedReasons[reason];
}

export function isPaused(state) {
  return Object.keys(state.pausedReasons || {}).length > 0;
}

function runMinute(state, events) {
  tickPlant(state, 1);
  tickDelayedQueue(state, 1);
  tickActiveEvent(state, 1);
  maybeTriggerEvent(state, events);

  if (state.eventCooldownMin > 0) state.eventCooldownMin -= 1;
  state.simMinutes += 1;
  state.stats.risk = computeRisk(state);
}

function restartAfterGameOver(state, now) {
  state.history.unshift({ t: now, type: 'gameover', label: 'Run beendet (Health 0)' });
  const restart = createInitialState();
  restart.history = state.history.slice(0, 20);
  restart.telemetry = state.telemetry;
  restart.telemetry.push(JSON.stringify({ t: now, type: 'gameover' }));
  return restart;
}

export function fastForward(state, events, minutes) {
  const steps = Math.max(0, Math.floor(minutes));
  for (let i = 0; i < steps; i += 1) {
    runMinute(state, []);
    if (state.stats.health <= 0) return restartAfterGameOver(state, Date.now());
  }
  state.uiState = computeUiState(state.stats);
  return state;
}

export function updateEngine(state, events) {
  resetAdsOnNewDay(state);
  const now = Date.now();

  if (state.currentEvent) pauseEngine(state, 'modal');
  else resumeEngine(state, 'modal');

  const elapsedSec = Math.max(0, Math.floor((now - state.lastTickAt) / 1000));
  if (!isPaused(state) && elapsedSec > 0) {
    for (let i = 0; i < elapsedSec; i += 1) {
      runMinute(state, events);
      if (state.stats.health <= 0) return restartAfterGameOver(state, now);
    }
  }

  state.lastTickAt = now;
  state.uiState = computeUiState(state.stats);
  return state;
}
