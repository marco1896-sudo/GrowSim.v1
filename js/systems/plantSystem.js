import { clamp01 } from '../core/state.js';

const WATER_DRAIN = 0.0018;
const NUTRITION_DRAIN = 0.0012;

export function tickPlant(state, minutes = 1) {
  const s = state.stats;
  s.water = clamp01(s.water - WATER_DRAIN * minutes);
  s.nutrition = clamp01(s.nutrition - NUTRITION_DRAIN * minutes);

  const supplyLow = s.water < 0.34 || s.nutrition < 0.34;
  const supplyGood = s.water > 0.55 && s.nutrition > 0.55;

  const stressDelta = supplyLow ? 0.006 * minutes : supplyGood ? -0.0042 * minutes : -0.0012 * minutes;
  s.stress = clamp01(s.stress + stressDelta);

  const stressPenalty = s.stress > 0.75 ? 0.0062 * minutes : s.stress > 0.5 ? 0.0034 * minutes : 0.0012 * minutes;
  s.health = clamp01(s.health - stressPenalty + (supplyGood ? 0.0018 * minutes : 0));

  const growthGain = supplyGood && s.stress < 0.48 ? 0.0042 * minutes : 0.0005 * minutes;
  s.growth = clamp01(s.growth + growthGain);

  const riskBase = (1 - s.health) * 0.48 + s.stress * 0.34 + (1 - s.water) * 0.1 + (1 - s.nutrition) * 0.08;
  s.risk = clamp01(riskBase);

  if (s.growth > 0.75) state.plantStage = 'flower';
  else if (s.growth > 0.35) state.plantStage = 'veg';
  else state.plantStage = 'seedling';
}

export function applyAction(state, action) {
  const s = state.stats;
  if (action === 'water') s.water = clamp01(s.water + 0.16);
  if (action === 'feed') s.nutrition = clamp01(s.nutrition + 0.14);
  if (action === 'prune') {
    s.stress = clamp01(s.stress - 0.08);
    s.growth = clamp01(s.growth + 0.02);
  }
}
