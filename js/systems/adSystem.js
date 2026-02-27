import { clamp100 } from '../core/state.js';

export const DAILY_AD_LIMIT = 6;

function dayStamp(now = Date.now()) {
  return new Date(now).toISOString().slice(0, 10);
}

export function resetAdsOnNewDay(state) {
  const today = dayStamp();
  if (state.adDayStamp !== today) {
    state.adDayStamp = today;
    state.adViewsToday = 0;
  }
}

export function canWatchAd(state) {
  return state.adViewsToday < DAILY_AD_LIMIT;
}

export function isEmergencyAvailable(state) {
  return state.stats.health <= 40 || state.uiState === 'critical';
}

export function useAd(state, rewardType = 'analysis') {
  if (!canWatchAd(state)) {
    return { ok: false, reason: 'Tageslimit erreicht (6/Tag).' };
  }

  if (rewardType === 'rescue' && !isEmergencyAvailable(state)) {
    return { ok: false, reason: 'Emergency Ad nur im kritischen Zustand verfügbar.' };
  }

  state.adViewsToday += 1;

  if (rewardType === 'analysis') {
    state.analysisUnlocked = true;
  }

  if (rewardType === 'rescue') {
    state.stats.health = clamp100(state.stats.health + 30);
    state.stats.stress = clamp100(state.stats.stress - 18);
  }

  state.history.unshift({ t: Date.now(), type: 'ad', label: `Ad gesehen (${rewardType})` });
  state.history = state.history.slice(0, 20);
  state.telemetry.push(JSON.stringify({ t: Date.now(), type: 'ad', rewardType }));
  return { ok: true };
}
