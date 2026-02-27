import { computeUiState, createInitialState } from './state.js';
import { tickPlant } from '../systems/plantSystem.js';
import { applyDueDelayedEffects, maybeTriggerEvent } from '../systems/eventSystem.js';
import { resetAdsOnNewDay } from '../systems/adSystem.js';

export function updateEngine(state, events) {
  resetAdsOnNewDay(state);
  const now = Date.now();
  const elapsedSec = Math.max(0, Math.floor((now - state.lastTickAt) / 1000));
  if (elapsedSec > 0) {
    for (let i = 0; i < elapsedSec; i += 1) {
      tickPlant(state, 1);
      applyDueDelayedEffects(state, now);
      maybeTriggerEvent(state, events);
    }
    state.lastTickAt = now;
  }
  state.uiState = computeUiState(state.stats);
  if (state.stats.health <= 0) {
    state.history.unshift({ t: now, type: 'gameover', label: 'Run beendet (Health 0)' });
    const restart = createInitialState();
    restart.history = state.history.slice(0, 20);
    restart.telemetry = state.telemetry;
    restart.telemetry.push(JSON.stringify({ t: now, type: 'gameover' }));
    return restart;
  }
  return state;
}
