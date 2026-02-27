import { clamp01 } from '../core/state.js';

export const DAILY_AD_LIMIT = 6;

export function resetAdsOnNewDay(state) {
  const today = new Date().toDateString();
  if (state.dayStamp !== today) {
    state.dayStamp = today;
    state.adViewsToday = 0;
  }
}

export function canWatchAd(state) {
  return state.adViewsToday < DAILY_AD_LIMIT;
}

export function useAd(state, rewardType = 'deep-analysis') {
  if (!canWatchAd(state)) {
    return { ok: false, reason: 'Tageslimit erreicht (6/Tag).' };
  }
  state.adViewsToday += 1;
  state.analysisUnlocked = true;

  if (rewardType === 'rescue' && state.stats.health <= 0.4) {
    state.stats.health = clamp01(state.stats.health + 0.3);
    state.stats.stress = clamp01(state.stats.stress - 0.18);
  }

  state.history.unshift({ t: Date.now(), type: 'ad', label: `Ad gesehen (${rewardType})` });
  state.history = state.history.slice(0, 20);
  state.telemetry.push(JSON.stringify({ t: Date.now(), type: 'ad', rewardType }));

  return { ok: true };
}
