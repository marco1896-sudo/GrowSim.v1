import { clamp100 } from '../core/state.js';

export function tickPlant(state, minutes = 1) {
  const s = state.stats;

  s.water = clamp100(s.water - 0.18 * minutes);
  s.nutrition = clamp100(s.nutrition - 0.12 * minutes);

  let stressDelta = 0;
  if (s.water < 30 || s.nutrition < 30) stressDelta += 0.10 * minutes;
  if (s.water < 15 || s.nutrition < 15) stressDelta += 0.06 * minutes;
  if (s.water > 55 && s.nutrition > 55) stressDelta -= 0.08 * minutes;
  s.stress = clamp100(s.stress + stressDelta);

  let healthDelta = 0;
  if (s.stress > 70) healthDelta -= 0.10 * minutes;
  if (s.stress > 90) healthDelta -= 0.18 * minutes;
  if (s.water > 45 && s.nutrition > 45 && s.stress < 40) healthDelta += 0.06 * minutes;
  s.health = clamp100(s.health + healthDelta);

  let growthDelta = 0;
  if (s.water > 45 && s.nutrition > 45 && s.stress < 55) growthDelta += 0.10 * minutes;
  if (s.water > 35 && s.nutrition > 35 && s.stress < 70) growthDelta += 0.04 * minutes;
  if (s.water < 20 || s.nutrition < 20) growthDelta -= 0.06 * minutes;
  if (state.plantStage === 'flower' && growthDelta > 0) growthDelta *= 0.5;
  s.growth = clamp100(s.growth + growthDelta);

  if (s.growth >= 70) state.plantStage = 'flower';
  else if (s.growth >= 35) state.plantStage = 'veg';
  else state.plantStage = 'seedling';
}

export function applyAction(state, action) {
  const s = state.stats;
  if (action === 'water') s.water = clamp100(s.water + 16);
  if (action === 'feed') s.nutrition = clamp100(s.nutrition + 14);
  if (action === 'prune') {
    s.stress = clamp100(s.stress - 8);
    s.growth = clamp100(s.growth + 2);
  }
}
